const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data
  });
};

const errorResponse = (res, message, error = null, statusCode = 500) => {
  console.error(error); 

  return res.status(statusCode).json({
    success: false,
    message: message,
    serverMessage: error ? error.message : null 
  });
};

module.exports = {
  successResponse,
  errorResponse
};