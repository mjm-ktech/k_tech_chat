export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3', // For community providers pass the full package name (e.g. provider: 'strapi-provider-upload-google-cloud-storage')
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        params: {
          ACL: env('AWS_ACL', 'public-read'), // 'private' if you want to make the uploaded files private
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
  
  // "users-permissions": {
  //   config: {
  //     jwt: {
  //       expiresIn: "7d",
  //     },
  //     register: {
  //       allowedFields: [
  //         "first_name",
  //         "last_name",
  //         "username",
  //         "gender",
  //         "birthday",
  //         "phone",
  //         "size",
  //         "address",
  //       ],
  //     },
  //   },
  // },
 
  
});
