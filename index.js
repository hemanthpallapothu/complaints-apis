const express = require("express");
const app = express();
app.use(express.json());
const jwt=require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "Database.db");
let db = null;
const initilizeDBAndStart = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DataBase Error : '${error}'`);
  }
};
initilizeDBAndStart();

const authenticateToken=(request,response,next)=>{
  let jwtToken;
  const authHeader=request.headers["authorization"];
  if(authHeader!=undefined){
    jwtToken=authHeader.split(" ")[1];
  }
  if(jwtToken==undefined){
    response.send("Invalid JWT Token");
    response.status(401);
  }
  else{
    jwt.verify(jwtToken,"MY_SECRET_KEY",async(error,payload)=>{
      if(error){
        response.send("Invalid JWT Token");
        response.status(401);
      }
      else{ 
        request.payLoad=payload;
        next();
      }
    })
  }
}

//Register User

app.post("/register/", async (request, response) => {
  const {first_name,last_name,email,register,password,type}=request.body;
  const hashedPassword=await bcrypt.hash(password,10);
  const isUserExistQuery=`SELECT * FROM user_credentials where email='${email}';`;
  const isUserExist=await db.get(isUserExistQuery);
  if(isUserExist!=undefined){
    response.send("User Alredy Exist !");
    response.status(404);
  }
  else{
    const addUserQuery=`INSERT INTO user_credentials(first_name,last_name,email,register_number,password,type)
    VALUES(
      '${first_name}',
      '${last_name}',
      '${email}',
      '${register}',
      '${hashedPassword}',
      '${type}'
    )`;
    const dbResponse=await db.run(addUserQuery);
    response.send("User Created Successfully");
  }
});

//Login User

app.post('/login/',async(request,response)=>{
  const {email,password}=request.body;
  const isUserExistQuery=`SELECT * FROM user_credentials where email='${email}';`;
  const isUserExist=await db.get(isUserExistQuery);
  if(isUserExist==undefined){
    response.send("Invalid User");
    response.status(404);
  }
  else{
    const isPasswordCorrect=await bcrypt.compare(password,isUserExist.password);
    if(isPasswordCorrect==true){
      const payLoad={
        email:email,
        regNo: isUserExist.register_number,
        type: isUserExist.type
      }

      const jwtToken=jwt.sign(payLoad,"MY_SECRET_KEY");
      response.send({jwtToken});  
    }
    else{
      response.send("Invalid Password");
    }
  }
})

//Admin Complaints View

app.get('/admin/',authenticateToken,async(request,response)=>{
  const {payLoad}=request;
  const {type}=payLoad;
  if(type==="Admin"){
    const getComplaintsQuery=`SELECT * FROM complaints;`;
    const complaints=await db.all(getComplaintsQuery);
    response.send(complaints);
  }
  else{
    response.send("Invalid User");
    response.status(401);
  }
});

//Faculty and Students Complaints View

app.get('/complaints/',authenticateToken,async(request,response)=>{
  const {payLoad}=request;
  const {type}=payLoad;
  if(type==="Student" || type==="Faculty"){
    const getUsersQuery=`SELECT department,title,description,time_and_date,status,filename,filetype,filesize,filedata FROM complaints;`;
    const complaints=await db.all(getUsersQuery);
    response.send(complaints);
  }
  else{
    response.send("Invalid User");
    response.status(401);
  }
});

// Add Complaints
app.post('/complaints/',authenticateToken,async(request,response)=>{
  const {payLoad}=request;
  const {type}=payLoad;
  if(type==="Student" || type==="Faculty"){
    const {department,title,description,time_and_date,status,filename,filetype,filesize,filedata,email}=request.body;
    const addComplaintQuery=`INSERT INTO complaints(department,title,description,time_and_date,status,filename,filetype,filesize,filedata,email)
    VALUES(
      '${department}',
      '${title}',
      '${description}',
      '${time_and_date}',
      '${status}',
      '${filename}',
      '${filetype}',
      '${filesize}',
      '${filedata}',
      '${email}'
    )`;
    const dbResponse=await db.run(addComplaintQuery);
    response.send("Complaint Added Successfully");
  }
  else{
    response.send("Invalid User");
    response.status(401);
  }
});

//Update Complaint Status

app.put('/complaints/:complaintId/',authenticateToken,async(request,response)=>{
  const {payLoad}=request;
  const {type,email}=payLoad;
  const {status}=request.body;

  if(type==="Admin" && email===`${email}`){
    const {complaintId}=request.params;
    const {status}=request.body;
    
  }
  else{
    response.send("Invalid User");
    response.status(401);
  }
});

module.exports = app;