const ConfigConstant = {
  THROTTLE_TIME: 500,
  NUDGE_ANIMATION_DELAY: 2000,

  //Doc Upload Per Page
  DOC_PER_PAGE: 4,
  NO_OF_DOC_PAGE: 4,
  DOC_UPLOAD_SIZE: 25, //MB

  //regex
  PINCODE_REGEX: '^[1-9][0-9]{5}$',
  ADD_REGEX: '^[a-zA-Z0-9 .,-]{3,100}$', //'^[a-zA-Z0-9 &\\-.]{3,50}$',
  MOBILE_REGEX: '^[0-9]{10}$',
  NAME_REGEX: '^[a-zA-Z0-9 .,]{3,100}$', //'^[a-zA-Z0-9 &\\-.]{3,50}$',
  EMAIL_REGEX: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',

  //request constants
  CLIENT_TYPE: 'B2C',
  CLIENT_NAME: 'INDIVIDUAL',
  SOURCE: 'CARS_24_SUPPER_APP',
  WORKFLOW_NAME: 'post_cart',
  TENANT: 'RTO',
  FILE_UPLOAD_SERVICE: 'DMS',

  //MANUAL_CODE
  REDIRECT_FROM: 'SDK_NUDGE',
};

const Config = {
    ConfigConstant
}

export default Config;
