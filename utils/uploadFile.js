const imageKit = require("../config/imageKit.js");

/**
 * Uploads a file to a specified folder using ImageKit.
 *
 * @param {string|Buffer} file - The file to be uploaded. It can be a base64 string, URL, or file buffer.
 * @param {string} fileName - The name to be assigned to the uploaded file.
 * @param {string} folder - The folder path where the file should be uploaded.
 * @returns {Promise<Object>} - A promise that resolves with the result of the upload or rejects with an error message.
 */
const uploadFile = (file, fileName, folder) => {
  return new Promise((resolve, reject) => {
    imageKit.upload(
      {
        file,
        fileName,
        folder: folder,
      },
      (err, result) => {
        if (err) {
          return reject(err.message);
        } else {
          return resolve(result);
        }
      }
    );
  });
};

/**
 * Deletes a file using the provided file ID.
 *
 * @param {string} fileId - The ID of the file to be deleted.
 * @returns {Promise<Object>} A promise that resolves with the result of the deletion or rejects with an error message.
 */
const deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    imageKit.deleteFile(fileId, (err, result) => {
      if (err) {
        console.error("Error deleting file:", err);
        return reject(err.message);
      } else {
        return resolve(result);
      }
    });
  });
};


/**
 * Deletes multiple files in bulk using their file IDs.
 *
 * @param {Array<string>} fileIds - An array of file IDs to be deleted.
 * @returns {Promise<Object>} A promise that resolves with the result of the deletion operation or rejects with an error message.
 */
const bulkDeleteFiles = (fileIds) => {
  return new Promise((resolve, reject) => {
    imageKit.bulkDeleteFiles(fileIds, (err, result) => {
      if (err) {
        return reject(err.message);
      } else {
        return resolve(result);
      }
    });
  });
};

module.exports = {
  uploadFile,
  deleteFile,
  bulkDeleteFiles,
};
