const AvailableServices = require("../../models/availableServices"); 

exports.getServiceByTitle = async (title)=>{
    
    const availableService = await AvailableServices.findOne({title})
    
    return availableService
}

exports.getServiceById = async (id)=>{
    
    const availableService = await AvailableServices.findById(id);
    
    return availableService

}



