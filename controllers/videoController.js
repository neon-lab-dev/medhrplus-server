const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Video = require("../models/videos.js");
const { uploadFile, deleteFile } = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");

exports.createVideo = catchAsyncErrors(async (req, res, next) => {
  const { title } = req.body;
  const videoFile = req.files?.video?.[0];

  if (!videoFile) {
    return next(new ErrorHandler("Please Upload a Video", 400));
  }

  try {
    const videoUri = getDataUri(videoFile);
    const uploadedVideo = await uploadFile(
      videoUri.content,
      videoUri.fileName,
      "videos"
    );

    const video = await Video.create({
      title,
      fileId: uploadedVideo.fileId,
      name: uploadedVideo.name,
      url: uploadedVideo.url,
    });

    res.status(201).json({
      success: true,
      video,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.getVideo = catchAsyncErrors(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }

  res.status(200).json({
    success: true,
    video,
  });
});

exports.updateVideo = catchAsyncErrors(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }

  const { title } = req.body;
  const videoFile = req.files?.video?.[0];

  if (!videoFile) {
    return next(new ErrorHandler("Please Upload a Video", 400));
  }
  if (video.fileId && videoFile) {
    await deleteFile(video.fileId);
  }
  if (videoFile) {
    const videoUri = getDataUri(videoFile);
    const uploadedVideo = await uploadFile(
      videoUri.content,
      videoUri.fileName,
      "videos"
    );
    if (title) {
      video.title = title;
    }

    video.fileId = uploadedVideo.fileId;
    video.name = uploadedVideo.name;
    video.url = uploadedVideo.url;
  }

  await video.save();

  res.status(200).json({
    success: true,
    video,
    message: "Video updated successfully",
  });
});

exports.deleteVideo = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Please provide a video id", 400));
  }
  const video = await Video.findById(id);

  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }

  if (video.fileId) {
    await deleteFile(video.fileId);
  }

  await video.deleteOne();

  res.status(200).json({
    success: true,
    message: "Video deleted successfully",
  });
});
