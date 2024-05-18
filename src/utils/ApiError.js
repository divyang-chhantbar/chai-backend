// here we will override methods from Error class
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null; // we can use this to send data to the client
        this.message = message;
        this.success = false;   
        this.errors = errors

        if(stack) {
            this.stack = stack;
        }else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError};