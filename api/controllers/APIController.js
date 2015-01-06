module.exports = {

  info: function(req, res) {
    res.send('no_info');
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncOffices: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    // TODO: Add positionCount

    Office
      .find({ company: req.session.userinfo.company.id })
      .then(function(companyOffices) {
        res.json(companyOffices);
      })
      .catch(es.wrap(function(err) {
        throw ExceptionService.error(err);
      }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncEmployees: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    PopUser
      .manyPromise({ company: req.session.userinfo.company.id }, {})
      .then(function(employees) {
        res.json(employees);
      })
      .catch(es.wrap(function(err) {
        throw ExceptionService.error(err);
      }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncRoles: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    Role
      .find({ companyId: req.session.userinfo.company.id })
      .then(function(companyRoles) {
        var employeesInRole = User
          .find({ role: _.pluck(companyRoles, 'id') })
          .then(function(_employeesInRole) {
            return _employeesInRole;
          });

        return [companyRoles, employeesInRole];
      })
      .spread(function(companyRoles, employeesInRole) {
        companyRoles.forEach(function(_role) {
          _role.employeeCount = _.where( employeesInRole, { role: _role.id }).length;
        });
        res.json(companyRoles);
      })
      .catch(es.wrap(function(err) {
        throw ExceptionService.error(err);
      }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncWorkers: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    Clock
      .find({ company: req.session.userinfo.company.id, working: true})
      .populate('position')
      .populate('office')
      .then(function(clockedInWorkers) {
        var workerUsers = User
          .find({ id: _.pluck(clockedInWorkers, 'user') })
          .populate('role')
          .then(function(workerUser) {
            return workerUser;
          });

        return [clockedInWorkers, workerUsers];
      })
      .spread(function(clockedInWorkers, workerUsers) {
        var workerUsersArray = _.indexBy(workerUsers, 'id');

        var response = [];

        clockedInWorkers.forEach(function(_worker) {
          response.push({
            workerId: _worker.user,
            workerPicture: workerUsersArray[_worker.user].picture,
            workerJob: workerUsersArray[_worker.user].role.jobTitle,
            workerName: workerUsersArray[_worker.user].fullName(),
            clockedPosition: _worker.position.name,
            clockedLocation: _worker.office.name
          });
        });

        res.json(response);
      })
      .catch(es.wrap(function() {
        throw ExceptionService.error('Could not get working clocks.');
      }));
  }

};