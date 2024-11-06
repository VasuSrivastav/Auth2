import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();
const saltRounds = 10;

const config = { 

  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  // port: process.env.PORT,
  port: 21471,
  database: process.env.DATABASE,
  ssl: {
      rejectUnauthorized: true,
      // ca: fs.readFileSync('./ca.pem').toString(),
      ca: process.env.CA,
  },
};
const db = new pg.Client(config);
db.connect();

const app = express();
const port = 3000;

// for local db
// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "secrets",
//   password: "123456",
//   port: 5432,
// });
// db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// get all users from db
async function getAllUsers() {
  try {
    const result = await db.query("SELECT * FROM userbt");
    console.log(result.rows);
  }
  catch (err) {
    console.error(err);
  }
}
await getAllUsers();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM userbt WHERE email = $1", [
      email,
    ]);
    if (checkResult.rows.length > 0) {
      // res.send("Email already exists. Try logging in.");
      res.render("extra.ejs",{errmessage:"Email already exists. Try logging in."});
    } else {
      // const hashedPassword = await bcrypt.hash(password, saltRounds);
      bcrypt.hash(password, saltRounds, async function(err, hash) {
        if (err) {
          console.log("not register error:",err);
        }
        else {
          const result = await db.query(
            "INSERT INTO userbt (email, password) VALUES ($1, $2) ;",
            [email, hash]
          );
          // console.log(result.rows);
          // res.render("secrets.ejs");
          // res.send("Registered now logging in.");
          res.render("extra.ejs",{errmessage:"Registered, now logging in."});
        }
      }
      );


    }
  } catch (err) {
    console.log(err);
    
  // res.redirect("/");
  res.render("extra.ejs",{errmessage:"error Occur retry."});

  }
  //   if (checkResult.rows.length > 0) {
  //     res.send("Email already exists. Try logging in.");
  //   } else {
  //     const result = await db.query(
  //       "INSERT INTO users (email, password) VALUES ($1, $2)",
  //       [email, password]
  //     );
  //     console.log(result);
  //     res.render("secrets.ejs");
  //   }
  // } catch (err) {
  //   console.log(err);
  // }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM userbt WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {

      const user = result.rows[0];
      const storedPassword = user.password;

      bcrypt.compare(password, storedPassword, function(err, result) {
        if (err) {
          console.log("not login error:",err);
        }
        else {
          if (result) {
            res.render("secrets.ejs");
          } else {
            res.render("extra.ejs",{errmessage:"Incorrect Password"});
          }
        }
      }
      );
      //
      //

      // if (password === storedPassword) {
      //   res.render("secrets.ejs");
      // } else {
      //   // res.send("Incorrect Password");
      //   res.render("extra.ejs",{errmessage:"Incorrect Password"});
      // }
    } else {
      // res.send("User not found");
      res.render("extra.ejs",{errmessage:"User not found"});
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
    res.render("extra.ejs",{errmessage:"error Occur retry."});
  }
  //     } else {
  //       res.send("Incorrect Password");
  //     }
  //   } else {
  //     res.send("User not found");
  //   }
  // } catch (err) {
  //   console.log(err);
  // }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
