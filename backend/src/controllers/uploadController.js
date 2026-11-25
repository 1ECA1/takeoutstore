const cloudinary = require("../config/cloudinary");

const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Please select at least one image.",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "enterprise-ecommerce/products",
                resource_type: "image",
              },
              (error, result) => {
                if (error) return reject(error);

                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
              },
            );

            stream.end(file.buffer);
          }),
      ),
    );

    return res.status(200).json({
      status: "success",
      message: "Product images uploaded successfully.",
      results: uploadedImages.length,
      data: {
        images: uploadedImages,
      },
    });
  } catch (error) {
    console.error("Product image upload failed:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Image upload failed. Please try again.",
    });
  }
};

module.exports = { uploadProductImages };