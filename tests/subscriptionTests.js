const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../src/app');
const db = require('../src/models/V1');

chai.use(chaiHttp);

describe('Subscription API', function () {
  this.timeout(10000);

  let testUserId;
  let subscriptionId;
  let sessionCookie;

  before(async () => {
    // Sync database
    await db.sequelize.sync({ force: true });

    // Create a test user
    const user = await db.User.create({
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedPassword',
      passwordSalt: 'salt',
    });
    testUserId = user.id;
  });

  after(async () => {
    // Cleanup
    await db.sequelize.close();
  });

  describe('POST /api/v1/subscriptions', () => {
    it('should add a new subscription', (done) => {
      chai
        .request(app)
        .post('/api/v1/subscriptions')
        .set('Cookie', sessionCookie)
        .send({
          userId: testUserId,
          serviceName: 'Premium Support',
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('serviceName', 'Premium Support');
          expect(res.body.data).to.have.property('isActive', true);
          subscriptionId = res.body.data.id;
          done();
        });
    });

    it('should return 400 if userId is missing', (done) => {
      chai
        .request(app)
        .post('/api/v1/subscriptions')
        .set('Cookie', sessionCookie)
        .send({
          serviceName: 'Premium Support',
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });

    it('should return 404 if user does not exist', (done) => {
      chai
        .request(app)
        .post('/api/v1/subscriptions')
        .set('Cookie', sessionCookie)
        .send({
          userId: 99999,
          serviceName: 'Premium Support',
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('GET /api/v1/subscriptions/active/:userId', () => {
    it('should get active subscriptions for a user', (done) => {
      chai
        .request(app)
        .get(`/api/v1/subscriptions/active/${testUserId}`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.be.greaterThan(0);
          done();
        });
    });

    it('should return 404 if user does not exist', (done) => {
      chai
        .request(app)
        .get('/api/v1/subscriptions/active/99999')
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('GET /api/v1/subscriptions/services/active/:userId', () => {
    it('should get active service names for a user', (done) => {
      chai
        .request(app)
        .get(`/api/v1/subscriptions/services/active/${testUserId}`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('count');
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/v1/subscriptions/check/:userId/:serviceName', () => {
    it('should check if user has subscription to service', (done) => {
      chai
        .request(app)
        .get(`/api/v1/subscriptions/check/${testUserId}/Premium%20Support`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('hasSubscription');
          done();
        });
    });

    it('should return hasSubscription false for non-existent service', (done) => {
      chai
        .request(app)
        .get(`/api/v1/subscriptions/check/${testUserId}/Non%20Existent%20Service`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('hasSubscription', false);
          done();
        });
    });
  });

  describe('PUT /api/v1/subscriptions/:subscriptionId/end', () => {
    it('should end a subscription', (done) => {
      chai
        .request(app)
        .put(`/api/v1/subscriptions/${subscriptionId}/end`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('isActive', false);
          expect(res.body.data).to.have.property('endDate');
          done();
        });
    });

    it('should return 400 if subscription is already inactive', (done) => {
      chai
        .request(app)
        .put(`/api/v1/subscriptions/${subscriptionId}/end`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });

    it('should return 404 if subscription does not exist', (done) => {
      chai
        .request(app)
        .put('/api/v1/subscriptions/99999/end')
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('PUT /api/v1/subscriptions/:subscriptionId/reactivate', () => {
    it('should reactivate an inactive subscription', (done) => {
      chai
        .request(app)
        .put(`/api/v1/subscriptions/${subscriptionId}/reactivate`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('isActive', true);
          expect(res.body.data).to.have.property('endDate', null);
          done();
        });
    });

    it('should return 400 if subscription is already active', (done) => {
      chai
        .request(app)
        .put(`/api/v1/subscriptions/${subscriptionId}/reactivate`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('DELETE /api/v1/subscriptions/:subscriptionId', () => {
    it('should delete a subscription', (done) => {
      chai
        .request(app)
        .delete(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          done();
        });
    });

    it('should return 404 if subscription does not exist', (done) => {
      chai
        .request(app)
        .delete('/api/v1/subscriptions/99999')
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('GET /api/v1/subscriptions/all/:userId', () => {
    it('should get all subscriptions including deleted ones', (done) => {
      chai
        .request(app)
        .get(`/api/v1/subscriptions/all/${testUserId}`)
        .set('Cookie', sessionCookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });
});
