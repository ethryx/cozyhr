var ADMIN_UTILS = function() { ADMIN_UTILS.instance = this; };

ADMIN_UTILS.instance = null;

ADMIN_UTILS.prototype.init = function() {
  $(document).ready(function(){
    if( $('#companyEmployees').length > 0 ) {
      // Set up the table
      $('#companyEmployees').dataTable({
        "pageLength": 50,
        "oLanguage": {
          "sEmptyTable": "There are no employees to display here."
        }
      });
      // Bind click event to invite a new employee
      $('#btnInviteEmployee').on('click', function() {
        if($('#txtNewEmployeeEmail').val().length > 0) {
          io.socket.post('/admin/do_invite', {
            email: $('#txtNewEmployeeEmail').val(),
            role: $('#selNewEmployeeRole').val()
          }, function(res) {
            if(res.success)
              document.location = "/admin/employees";
            else
              alert(res.error);
          });
        }
      });
    } else if ( $('#companyRoles').length > 0 ) {
      // Init the data table
      $('#companyRoles').dataTable({
        "pageLength": 50,
        "ajax": {
          "url": "/admin/getRoles",
          "type": "GET"
        },
        "columns": [
          { "data": "jobTitle", "render": function(d,t,r,m) { return "<a href='/admin/role/" + r.id + "'>"+d+"</a>"; } },
          { "data": "employeeCount" }
        ]
      });
      // Init events
      $('#btnCreateRole').on('click', function(){
        if( $('#txtNewRole').val().length > 0) {
          io.socket.post('/admin/newRole', {
            roleName: $('#txtNewRole').val()
          }, function(res) {
            if(res.success) {
              $('#companyRoles').DataTable().ajax.reload();
            } else {
              alert(res.error);
            }
          });
        }
      });
    }
  }.bind(ADMIN_UTILS.instance));
};