// boilerplate code begin
process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const should = chai.should();
const mockDb = require('../db.js');
const app = require("../app.js");
const assert = chai.assert;

require('dotenv').config();
const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJwt = passportJWT.ExtractJwt;
const jwt = require('jsonwebtoken');
const jwtOptions = {
    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_OR_KEY,
};


const mongoose = require('mongoose');
const User = mongoose.model('User');
const Course = mongoose.model("Course");
const Post = mongoose.model("Post");
const Reply = mongoose.model("Reply");

// boilerplate end

describe('GET courses: /my-courses', () => {
    before((done) => {
        mockDb.connect()
            .then(() => {
                new User({
                    email: "abc@nyu.edu",
                    firstname: "Aaa",
                    lastname: "Bbb",
                    role: "Instructor",
                    password: "xxx",
                    courses: [],
                }).save(err=>{
                    done();
                })
            })
            .catch((err) => done(err));
    });

    after((done) => {
        mockDb.close()
            .then(() => done())
            .catch((err) => done(err));
    });

    it("should be a protected path", (done) => {
        chai.request(app)
            .get("/my-courses")
            .end((err,res)=>{
                res.should.have.status(401);
                done();
            });
    });

    it("should return appropriate json to authenticated user", (done) => {
        User.findOne({uid:1},(err,user)=>{
            const payload = {uid:user.uid};
            const token = jwt.sign(payload, jwtOptions.secretOrKey,{expiresIn: 300});
            chai.request(app)
                .get("/my-courses")
                .set("Authorization",`Bearer ${token}`)
                .end((err,res)=>{
                    it("should return 200 with valid access token",()=> {
                        res.should.have.status(200);
                    });
                    const data = JSON.parse(res.text);
                    it("should contain role and courses",()=>{
                        data.should.haveOwnProperty("role");
                        data.should.haveOwnProperty("courses");
                        data.role.should.equal('Instructor');
                        assert.isArray(data.courses);
                        assert.notStrictEqual(data.courses,[])
                    });
                    done();
                });
        });
    });
});
