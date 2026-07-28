class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  
  function isApiError(err) {
    return err && typeof err === "object" && typeof err.status === "number" && typeof err.code === "string";
  }
  
  module.exports = { ApiError, isApiError };
  