// we will do this by 2 Approaches 1) using Promises 2) using try catch block

// Approach 1 : using Promises
    const asyncHandler = (requestHandler) => {
        (req, res, next) => {
            Promise.resolve(requestHandler(req, res, next))
            .catch((error)=> next(error))
        }
    }

// Approach 2 : using try catch block

// here we have used higher order functions.

    // const asyncHandler = (fn) => async (req, res, next) => {
    //     try{
    //         await fn(req, res, next)
    //     }
    //     catch(error){
    //         res.status(error.code || 500).json({
    //             success: false,
    //             message: error.message || "Internal Server Error"
    //         })
    //     }
    // }

    // now we want to standardize our error and response too so we will make another folder .