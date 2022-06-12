const AvailableServices = require("../../models/availableServices"); 
const Gigs = require("../../models/service"); 

const findServiceProviders = async (serviceName, filters, {sortBy, limit, skip}) => {

    let {subCategory, propertyType, language, paymentMethod} = filter;

    await Gigs.aggregate([
    {
      '$match': {
        '$and': [
          {
            '$or':[
                {
                    'category': serviceName
                },
                {
                    'subCategories': subCategory
                }
            ]
            
          },
          {
              'languages': language
          },
          {
              'propertyTypes': propertyType
          },
          {
              'paymentMethodsAccepted': paymentMethod
          },
        //   {
        //     'teamMembers': {
        //       '$in': [
        //         '3'
        //       ]
        //     }
        //   },
        ]
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'let': {
          'spId': '$owner.id'
        }, 
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$and': [
                  {
                    '$eq': [
                      '$isActive', true
                    ], 
                    '$eq': [
                      '$_id', '$$spId'
                    ]
                  }
                ]
              }
            }
          }, {
            '$project': {
              'companyName': 1, 
              'zipCode': 1
            }
          }
        ], 
        'as': 'owner'
      }
    },

    {
        '$sort':{
            ...sortBy
        }
    }
  ]);
  
}


module.exports = findServiceProviders;