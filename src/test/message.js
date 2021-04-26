require("dotenv").config();
const app = require("../server.js");
const mongoose = require("mongoose");
const chai = require("chai");
const chaiHttp = require("chai-http");
const assert = chai.assert;

const User = require("../models/user.js");
const Message = require("../models/message.js");

chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);


/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

describe("Message API endpoints", () => {
  beforeEach((done) => {
    const sampleUser = new User({
      username: "newuser",
      password: "mypassword",
    });

    const sampleMessage = new Message({
      title: "mytitle",
      body: "mybody",
    });

    sampleUser.save().then(() => {
      sampleMessage.author = sampleUser
      return sampleMessage.save()
    }).then(() => {
      sampleUser.messages.unshift(sampleMessage)
      return sampleUser.save()
    }).then(() => {
      done()
    })
  });

  afterEach((done) => {
    User.deleteMany({'username': ['newuser']}).then(() => {
      return Message.deleteMany({ title: ["mytitle", "anothertitle"]});
    }).then(() => {
      done()
    })
  });

  it("should load all messages", (done) => {
    chai
      .request(app)
      .get("/messages")
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.messages).to.be.an("array");
        done();
      });
  });

  it("should get one specific message", (done) => {
    const message = Message.findOne({ title: "mytitle" });
    chai
      .request(app)
      .get(`/messages/${message._id}`)
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("object");
        expect(res.body.title).to.equal("mytitle");
        done();
      });
  });

  it("should post a new message", (done) => {
    User.findOne({ username: "newuser" }).then((user) => {
      chai
        .request(app)
        .post("/messages")
        .send({
          title: "anothertitle",
          body: "anotherbody",
          author: user,
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("title", "anothertitle");
          // check that message is actually inserted into database
          Message.findOne({ title: "anothertitle" }).then((message) => {
            expect(message).to.be.an("object");
            done();
          });
        });
    });
    })
    
})

  // it("should update a message", (done) => {
  //   // TODO: Complete this
  //   done();
  // });

  // it("should delete a message", (done) => {
  //   const message = Message.findOne({ title: "mytitle" });
  //   chai.request(app)
  //       .delete(`/messages/${message._id}`)
  //       .end((err, res) => {
  //           if (err) { done(err) }
  //           expect(res.body.message).to.equal('Successfully deleted.')
  //           expect(res.body._id).to.equal(message._id)

  //           // check that user is actually deleted from database
  //           Message.findOne({title: 'mytitle'}).then(message => {
  //               expect(message).to.equal(null)
  //               done()
  //           })
  //       })
  //   })
