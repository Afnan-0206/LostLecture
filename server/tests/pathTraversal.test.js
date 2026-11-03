import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import {
  uploadDir,
  storage,
  safeDeleteUpload,
  safeDeleteFile,
  processFileUpload,
} from '../middleware/uploadMiddleware.js';

async function runPathTraversalTests() {
  console.log('\n--- 🛡️ RUNNING COMPLETE PATH TRAVERSAL & CLEANUP REGRESSION TESTS ---\n');
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 1. Normal file deletion inside uploads/
  const validTestFile = path.join(uploadDir, `test-cleanup-${Date.now()}.txt`);
  fs.writeFileSync(validTestFile, 'Temporary upload test data');
  assert(fs.existsSync(validTestFile), 'Setup: Valid test file created in uploads directory');

  const deleteResult = safeDeleteUpload(validTestFile);
  assert(deleteResult === true, 'Valid file deletion returns true');
  assert(!fs.existsSync(validTestFile), 'Valid file is successfully removed from disk');

  // Also test safeDeleteFile alias
  const validTestFileAlias = path.join(uploadDir, `test-alias-${Date.now()}.txt`);
  fs.writeFileSync(validTestFileAlias, 'Temporary alias test data');
  const aliasResult = safeDeleteFile(validTestFileAlias);
  assert(aliasResult === true && !fs.existsSync(validTestFileAlias), 'safeDeleteFile alias successfully deletes valid file');

  // 2. Parent-directory traversal (uploads/../package.json)
  const packageJsonPath = path.resolve('package.json');
  assert(fs.existsSync(packageJsonPath), 'Setup: package.json exists');
  const traversalAttempt1 = path.join('uploads', '..', 'package.json');
  const traversalResult1 = safeDeleteUpload(traversalAttempt1);
  assert(traversalResult1 === false, 'Parent-directory traversal (uploads/../package.json) is rejected');
  assert(fs.existsSync(packageJsonPath), 'Target file (package.json) remains untouched');

  // 3. Deep traversal (../../server.js)
  const serverJsPath = path.resolve('server.js');
  const traversalAttempt2 = path.join('..', '..', 'server.js');
  const traversalResult2 = safeDeleteUpload(traversalAttempt2);
  assert(traversalResult2 === false, 'Deep traversal (../../server.js) is rejected');
  assert(fs.existsSync(serverJsPath), 'Target file (server.js) remains untouched');

  // 4. Sibling-directory prefix bypass (e.g. uploads_sibling/secret.txt)
  const siblingDir = path.resolve('uploads_sibling_test');
  if (!fs.existsSync(siblingDir)) {
    fs.mkdirSync(siblingDir, { recursive: true });
  }
  const siblingFile = path.join(siblingDir, 'do_not_delete.txt');
  fs.writeFileSync(siblingFile, 'Confidential sibling data');

  const siblingResult = safeDeleteUpload(siblingFile);
  assert(siblingResult === false, 'Sibling-directory prefix bypass attempt is rejected');
  assert(fs.existsSync(siblingFile), 'File in sibling directory remains untouched');

  // Cleanup sibling directory fixtures
  fs.unlinkSync(siblingFile);
  fs.rmdirSync(siblingDir);

  // 5. Absolute external path rejection
  const externalAbsFile = path.resolve('external_abs_test.txt');
  fs.writeFileSync(externalAbsFile, 'External absolute path file');
  const absResult = safeDeleteUpload(externalAbsFile);
  assert(absResult === false, 'Absolute path outside upload directory is rejected');
  assert(fs.existsSync(externalAbsFile), 'External absolute file remains untouched');
  fs.unlinkSync(externalAbsFile);

  // 6. Filename beginning with '..' inside uploads (avoid false positives)
  const dotDotFilename = path.join(uploadDir, `..prefixed-notes-${Date.now()}.pdf`);
  fs.writeFileSync(dotDotFilename, 'File beginning with two dots in uploads');
  const dotDotResult = safeDeleteUpload(dotDotFilename);
  assert(dotDotResult === true, 'Valid file starting with .. inside upload directory is deleted without false positive');
  assert(!fs.existsSync(dotDotFilename), 'File starting with .. was deleted');

  // 7. Upload directory itself and subdirectories (never delete directories)
  const dirResult = safeDeleteUpload(uploadDir);
  assert(dirResult === false, 'Attempt to delete uploads directory itself is rejected');
  assert(fs.existsSync(uploadDir), 'Uploads directory still exists');

  const subDir = path.join(uploadDir, 'test_sub_dir');
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
  const subDirResult = safeDeleteUpload(subDir);
  assert(subDirResult === false, 'Attempt to delete a subdirectory inside uploads is rejected');
  assert(fs.existsSync(subDir), 'Subdirectory still exists');
  fs.rmdirSync(subDir);

  // 8. Symlink pointing OUTSIDE the upload directory
  const externalSymlinkTarget = path.resolve('external_symlink_target.txt');
  fs.writeFileSync(externalSymlinkTarget, 'Target file outside uploads directory');
  const symlinkPathExternal = path.join(uploadDir, `test-symlink-ext-${Date.now()}.txt`);

  let extSymlinkCreated = false;
  try {
    if (fs.existsSync(symlinkPathExternal)) fs.unlinkSync(symlinkPathExternal);
    fs.symlinkSync(externalSymlinkTarget, symlinkPathExternal, 'file');
    extSymlinkCreated = true;
  } catch (symlinkErr) {
    if (symlinkErr.code === 'EPERM' || symlinkErr.code === 'ENOTSUP') {
      console.warn(`  ⚠️ SKIP: Symlink creation not permitted by OS policy (Windows SeCreateSymbolicLinkPrivilege required). Test skipped, not counted as passed.`);
      skipped++;
    } else {
      console.error(`  ❌ FAIL: Symlink creation encountered unexpected error: ${symlinkErr.message}`);
      failed++;
    }
  }

  if (extSymlinkCreated) {
    const symlinkResult = safeDeleteUpload(symlinkPathExternal);
    assert(symlinkResult === false, 'safeDeleteUpload rejects symlink pointing outside uploadDir');
    assert(fs.existsSync(externalSymlinkTarget), 'External file pointed to by symlink remains untouched');

    try {
      fs.unlinkSync(symlinkPathExternal);
    } catch (_) {}
  }

  if (fs.existsSync(externalSymlinkTarget)) {
    fs.unlinkSync(externalSymlinkTarget);
  }

  // 9. Symlink pointing INSIDE the upload directory (deletes symlink itself, preserving target)
  const internalTargetFile = path.join(uploadDir, `internal-target-${Date.now()}.txt`);
  fs.writeFileSync(internalTargetFile, 'Genuine target inside uploads');
  const internalSymlinkPath = path.join(uploadDir, `internal-symlink-${Date.now()}.txt`);

  let intSymlinkCreated = false;
  try {
    if (fs.existsSync(internalSymlinkPath)) fs.unlinkSync(internalSymlinkPath);
    fs.symlinkSync(internalTargetFile, internalSymlinkPath, 'file');
    intSymlinkCreated = true;
  } catch (symlinkErr) {
    if (symlinkErr.code === 'EPERM' || symlinkErr.code === 'ENOTSUP') {
      console.warn(`  ⚠️ SKIP: Internal symlink creation not permitted by OS policy. Test skipped, not counted as passed.`);
      skipped++;
    } else {
      console.error(`  ❌ FAIL: Internal symlink creation encountered unexpected error: ${symlinkErr.message}`);
      failed++;
    }
  }

  if (intSymlinkCreated) {
    const intResult = safeDeleteUpload(internalSymlinkPath);
    assert(intResult === true, 'safeDeleteUpload on internal symlink returns true');
    assert(!fs.existsSync(internalSymlinkPath), 'Symlink itself is deleted');
    assert(fs.existsSync(internalTargetFile), 'Internal target file remains intact and preserved');
  }

  if (fs.existsSync(internalTargetFile)) {
    fs.unlinkSync(internalTargetFile);
  }

  // 10. Missing file safe handling (returns false, no throw)
  let missingFileThrew = false;
  let missingResult = null;
  try {
    missingResult = safeDeleteUpload(path.join(uploadDir, 'non-existent-file-999999.txt'));
  } catch (e) {
    missingFileThrew = true;
  }
  assert(!missingFileThrew && missingResult === false, 'Missing file is handled safely without throwing');

  // 11. Invalid arguments safe handling
  assert(safeDeleteUpload(null) === false, 'safeDeleteUpload(null) returns false');
  assert(safeDeleteUpload(undefined) === false, 'safeDeleteUpload(undefined) returns false');
  assert(safeDeleteUpload(12345) === false, 'safeDeleteUpload(number) returns false');
  assert(safeDeleteUpload('') === false, 'safeDeleteUpload("") returns false');
  assert(safeDeleteUpload({}) === false, 'safeDeleteUpload({}) returns false');

  // 12. Multer storage engine path containment verification
  const mockReq = {};
  const mockMulterFile = { originalname: 'advanced_data_structures.pdf' };
  await new Promise((resolve, reject) => {
    storage.getDestination(mockReq, mockMulterFile, (err, destination) => {
      if (err) return reject(err);
      storage.getFilename(mockReq, mockMulterFile, (err2, filename) => {
        if (err2) return reject(err2);

        const generatedFullPath = path.join(destination, filename);
        const resolvedBase = path.resolve(uploadDir);
        const resolvedGenerated = path.resolve(generatedFullPath);
        const relative = path.relative(resolvedBase, resolvedGenerated);

        const isContained = Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
        assert(destination === uploadDir, 'Multer destination strictly matches configured uploadDir');
        assert(filename.startsWith('resource-'), 'Multer filename follows expected resource- prefix');
        assert(isContained, 'Multer-generated path is guaranteed strictly contained inside uploadDir');
        resolve();
      });
    });
  });

  // 13. processFileUpload fallback behavior (Cloudinary not configured)
  const mockLocalFile = {
    path: path.join(uploadDir, 'sample-lecture.pdf'),
    originalname: 'sample-lecture.pdf',
    mimetype: 'application/pdf',
  };
  const uploadFallbackResult = await processFileUpload(mockLocalFile);
  assert(
    uploadFallbackResult &&
    uploadFallbackResult.url === '/uploads/sample-lecture.pdf' &&
    uploadFallbackResult.fileName === 'sample-lecture.pdf',
    'processFileUpload generates correct fallback local URL when Cloudinary is not active'
  );

  // 14. processFileUpload with null/invalid input
  const nullFileResult = await processFileUpload(null);
  assert(
    nullFileResult && nullFileResult.url === null && nullFileResult.fileName === null,
    'processFileUpload handles null file gracefully'
  );

  // 15. Mocked Cloudinary Upload and Cleanup Test
  const originalEnvCloud = process.env.CLOUDINARY_CLOUD_NAME;
  const originalEnvKey = process.env.CLOUDINARY_API_KEY;
  const originalEnvSecret = process.env.CLOUDINARY_API_SECRET;
  const originalUploaderUpload = cloudinary.uploader.upload;

  try {
    process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud_production';
    process.env.CLOUDINARY_API_KEY = 'mock_api_key_11111';
    process.env.CLOUDINARY_API_SECRET = 'mock_api_secret_22222';

    cloudinary.uploader.upload = async (filePath, options) => {
      return {
        secure_url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1700000000/mock-notes.pdf',
        public_id: 'lostlecture_academic_resources/mock-notes-12345',
      };
    };

    // Sub-test 15A: Temporary file in uploads is safely deleted after successful upload
    const mockCloudinaryFile = path.join(uploadDir, `mock-cloudinary-${Date.now()}.pdf`);
    fs.writeFileSync(mockCloudinaryFile, '%PDF-1.4 Mock Lecture PDF');
    assert(fs.existsSync(mockCloudinaryFile), 'Setup: Temp file created in uploads for Cloudinary upload');

    const cloudinaryResult = await processFileUpload({
      path: mockCloudinaryFile,
      originalname: 'lecture-notes.pdf',
      mimetype: 'application/pdf',
    });

    assert(
      cloudinaryResult &&
      cloudinaryResult.url === 'https://res.cloudinary.com/mock-cloud/image/upload/v1700000000/mock-notes.pdf',
      'Cloudinary returned secure_url matches uploader result'
    );
    assert(
      cloudinaryResult.publicId === 'lostlecture_academic_resources/mock-notes-12345',
      'Cloudinary returned publicId matches uploader result'
    );
    assert(
      cloudinaryResult.fileName === 'lecture-notes.pdf',
      'Original fileName is preserved in Cloudinary result'
    );
    assert(
      !fs.existsSync(mockCloudinaryFile),
      'Temporary file inside uploads was safely deleted after Cloudinary upload'
    );

    // Sub-test 15B: File outside uploads cannot be deleted during Cloudinary cleanup
    const externalFile = path.resolve('external_cloudinary_protection_test.txt');
    fs.writeFileSync(externalFile, 'Critical external data that must not be deleted');
    assert(fs.existsSync(externalFile), 'Setup: External file created outside uploads');

    await processFileUpload({
      path: externalFile,
      originalname: 'external.txt',
      mimetype: 'text/plain',
    });

    assert(
      fs.existsSync(externalFile),
      'File outside uploads remains untouched and was NOT deleted by Cloudinary cleanup'
    );
    fs.unlinkSync(externalFile);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnvCloud;
    process.env.CLOUDINARY_API_KEY = originalEnvKey;
    process.env.CLOUDINARY_API_SECRET = originalEnvSecret;
    cloudinary.uploader.upload = originalUploaderUpload;
  }

  console.log(`\n======================================================`);
  console.log(`Path Traversal Tests: ${passed} PASSED | ${failed} FAILED | ${skipped} SKIPPED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPathTraversalTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
