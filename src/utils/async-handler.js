
// Basically it is an Higher Order Function Taking function as parameter and returning a function.
const asyncHandler = (requestHandler) => {
   return (req, res,next) => {
      Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
   } 
};


export {asyncHandler};