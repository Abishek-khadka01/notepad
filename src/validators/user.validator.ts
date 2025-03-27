import joi from "joi";

// Validator for user registration
const UserRegisterValidator = joi.object({
  username: joi
    .string()
    .required()
    .alphanum()
    .min(3)
    .max(20)
    // Adjusted regex: allows single spaces but not consecutive spaces
    .pattern(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/),
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required(),
  password: joi
    .string()
    .required()
    .min(6)
    .max(20),
});

// Validator for user login
const UserLoginValidator = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required(),
  password: joi
    .string()
    .required()
    .min(6)
    .max(20),
});

export { UserLoginValidator, UserRegisterValidator };
