/**
 * AdminController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

  index: function(req, res) {
    res.view({
      selectedPage: 'admin'
    });
  },

  general: function(req, res) {
    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'general'
    });
  },

  employees: function(req, res) {
    PopUser.many({company: req.session.userinfo.company.id}, {sort: 'lastName ASC'}, function (e, employees) {
      res.view('admin/index', {
          selectedPage: 'admin',
          selectedSection: 'employees',
          employees: employees
        });
    });
  },

  do_invite: function(req, res) {
    if(!req.isSocket)
      return;

    var invitedEmail = req.param('email');

    if(invitedEmail.indexOf('@') == -1 || invitedEmail.indexOf('@') == -1) {
      return res.json({ error: "invalid email format" });
    }

    Invite.findOne({ inviteEmail: invitedEmail.toLowerCase() }).exec(function(e, invites) {
      if(e || invites) {
        res.json({ error: "user was already invited" });
      } else {

        User.findOne({ email: invitedEmail }).exec(function(e, users) {
          if(e || users) {
            res.json({ error: "user already exists in db" });
          } else {

            Invite.create({
              inviteEmail: invitedEmail.toLowerCase(),
              invitedBy: req.session.userinfo.id,
              invitedTo: req.session.userinfo.company.id
            }).exec(function(e, inviteKey) {
              // queue up email
              QueueService.sendEmail({
                template: 'welcome',
                templateVars: {},
                to: invitedEmail,
                subject: "You've been invited to CozyHR!"
              });
              // done
              res.json({
                success: true,
                email: invitedEmail,
                token: inviteKey,
                companyName: req.session.userinfo.company.name
              });
            });

          }
        });

      }
    });
  },

  employee: function(req, res) {
    var userId = req.param('id');

    if(!userId) {
      return res.serverError(new Error('AdminEmployeeNotSpecifiedException'));
    }

    PopUser.one(userId, function(e, employee) {
      if(e || !employee) {
        return res.serverError(new Error('AdminEmployeeNotFoundException'));
      }

      // same company?
      if(employee.company.id != req.session.userinfo.company.id) {
        return res.serverError(new Error('AdminEmployeeCompanyMismatchException'));
      }

      // okay
      res.view('admin/employee/edit', {
        selectedPage: 'admin',
        employee: employee,
        selectedSection: 'basic'
      });
    });
  },

  roles: function(req, res) {
    // Get all the roles for the company
    Permission.find({ companyId: req.session.userinfo.company.id }, function(e, roles) {
      // Count the employees asynchonously
      async.each(roles, function(role, done) {
        User.find({ permissionId: role.id }, function(e, usrs) {
          role.employeeCount = usrs.length;
          done(); // go to next permission/role
        });
      }, function() {
        // Send to view
        res.view('admin/index', {
          selectedPage: 'admin',
          selectedSection: 'roles',
          roles: roles
        });
      });
    });
  },

  role: function(req, res) {
    var roleId = req.param('id');

    if(!roleId) {
      return res.serverError(new Error('AdminRoleNotSpecifiedException'));
    }

    Permission.findOne(roleId).exec(function(e, role){
      if(e || !role) {
        return res.serverError(new Error('AdminRoleNotFoundException'));
      }

      // same company?
      if(role.companyId != req.session.userinfo.company.id) {
        return res.serverError(new Error('AdminRoleCompanyMismatchException'));
      }

      var validSections = ['info', 'employees'];
      var selectedSection = req.param('section') || 'info';

      if(validSections.indexOf(selectedSection) == -1) {
        return res.serverError(new Error('AdminRoleInvalidSectionException'));
      }

      if(selectedSection == 'info') {
        res.view('admin/role/edit', {
          selectedPage: 'admin',
          selectedSection: 'info',
          role: role
        });
      } else if(selectedSection == 'employees') {
        UserSpecial.many({companyId: req.session.userinfo.company.id, permissionId: roleId}, {sort: 'lastName ASC'}, function(employees) {
          res.view('admin/role/edit', {
            selectedPage: 'admin',
            selectedSection: 'employees',
            role: role,
            employees: employees
          });
        });
      }
    });
  }

};
