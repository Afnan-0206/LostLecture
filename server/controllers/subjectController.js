import Subject from '../models/Subject.js';
import Resource from '../models/Resource.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all subjects with optional semester/search filter & resource count
// @route   GET /api/subjects
// @access  Public
export const getSubjects = asyncHandler(async (req, res) => {
  const { semester, search, page = 1, limit = 50 } = req.query;

  const query = { isActive: true };

  if (semester) {
    query.semester = Number(semester);
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Aggregate with resource counts
  const subjects = await Subject.aggregate([
    { $match: query },
    { $sort: { semester: 1, code: 1 } },
    {
      $lookup: {
        from: 'resources',
        let: { subjectId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$subject', '$$subjectId'] },
                  { $eq: ['$status', 'approved'] },
                ],
              },
            },
          },
        ],
        as: 'approvedResources',
      },
    },
    {
      $addFields: {
        resourceCount: { $size: '$approvedResources' },
        sampleResources: {
          $slice: [
            {
              $map: {
                input: '$approvedResources',
                as: 'res',
                in: {
                  _id: '$$res._id',
                  title: '$$res.title',
                  type: '$$res.type',
                  isPYQ: '$$res.isPYQ',
                  unit: '$$res.unit',
                  views: '$$res.views',
                },
              },
            },
            4,
          ],
        },
      },
    },
    {
      $project: {
        approvedResources: 0,
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        subjects,
        totalSubjects: subjects.length,
      },
      'Subjects retrieved successfully'
    )
  );
});

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Public
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject || !subject.isActive) {
    throw new ApiError(404, 'Subject not found');
  }

  const resourceCount = await Resource.countDocuments({
    subject: subject._id,
    status: 'approved',
  });

  const data = subject.toObject();
  data.resourceCount = resourceCount;

  res.status(200).json(new ApiResponse(200, data, 'Subject details retrieved'));
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private / Admin
export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, semester, description } = req.body;

  const existing = await Subject.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, `Subject code ${code.toUpperCase()} is already assigned to "${existing.name}".`);
  }

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    semester: Number(semester),
    description,
    isActive: true,
  });

  res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
});

// @desc    Update subject
// @route   PATCH /api/subjects/:id
// @access  Private / Admin
export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  const { name, code, semester, description, isActive } = req.body;

  if (code && code.toUpperCase() !== subject.code) {
    const codeConflict = await Subject.findOne({
      code: code.toUpperCase(),
      _id: { $ne: subject._id },
    });
    if (codeConflict) {
      throw new ApiError(409, `Subject code ${code.toUpperCase()} already in use.`);
    }
    subject.code = code.toUpperCase();
  }

  if (name) subject.name = name;
  if (semester) subject.semester = Number(semester);
  if (description !== undefined) subject.description = description;
  if (isActive !== undefined) subject.isActive = isActive;

  const updated = await subject.save();

  res.status(200).json(new ApiResponse(200, updated, 'Subject updated successfully'));
});

// @desc    Safe Delete Subject (Soft-delete / Archive preserving materials)
// @route   DELETE /api/subjects/:id
// @access  Private / Admin
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  const activeResourcesCount = await Resource.countDocuments({ subject: subject._id });

  if (activeResourcesCount > 0) {
    // Safe deletion strategy: Do not destroy materials, soft-delete / deactivate subject
    subject.isActive = false;
    await subject.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { archived: true, preservedResourcesCount: activeResourcesCount },
        `Subject safely deactivated and archived. Preserved ${activeResourcesCount} associated academic resources.`
      )
    );
  }

  // If no resources are attached, safe to remove permanently
  await subject.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Subject deleted successfully'));
});

