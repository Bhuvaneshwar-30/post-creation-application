const bcrypt = require("bcryptjs");

const plainPassword = "bhuvan1234";   // the password you entered at signup
const hashedPassword = "$2b$12$aHGervJxWQ5/umMrRBOAt.ie5GOnO4uIem6ZkzcabVNj2G3m/IFLe"  // copy from DB

bcrypt.compare(plainPassword, hashedPassword)
  .then(match => {
    console.log("Do they match?", match);
  })
  .catch(err => console.error(err));
