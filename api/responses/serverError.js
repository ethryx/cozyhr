/**
 * 500 (Server Error) Response
 *
 * Usage:
 * return res.serverError();
 * return res.serverError(err);
 * return res.serverError(err, 'some/specific/error/view');
 *
 * NOTE:
 * If something throws in a policy or controller, or an internal
 * error is encountered, Sails will call `res.serverError()`
 * automatically.
 */

module.exports = function serverError (data, options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  // Set status code
  res.status(500);

  // Log and Send this to the exception handler
  if(req.isSocket) {
    if(data !== undefined) {
      if(ExceptionService.socket(req, res, data)) {
        sails.log.warn('SocketException :: Sending 500 ("Server Error") response: \n',data);
      }
    } else {
      if(ExceptionService.socket(req, res)) {
        sails.log.warn('SocketException :: Sending empty 500 ("Server Error") response.');
      }
    }
    return; // No need to continue for sockets.
  } else {
    if(data !== undefined) {
      if(ExceptionService.http(req, res, data)) {
        sails.log.warn('HTTPException :: Sending 500 ("Server Error") response: \n',data);
      }
    } else {
      if(ExceptionService.http(req, res)) {
        sails.log.warn('HTTPException :: Sending empty 500 ("Server Error") response.');
      }
    }
  }

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production') {
    data = ((data.message)?data.message.replace(/"/g, "'"):undefined);
  } else {
    data = data.stack;
  }

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    return res.jsonx(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? { view: options } : options || {};

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, { data: data });
  }

  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  else return res.view('500', { data: data, env: process.env.NODE_ENV }, function (err, html) {

    // If a view error occured, fall back to JSON(P).
    if (err) {
      //
      // Additionally:
      // • If the view was missing, ignore the error but provide a verbose log.
      if (err.code === 'E_VIEW_FAILED') {
        sails.log.verbose('res.serverError() :: Could not locate view for error page (sending JSON instead).  Details: ',err);
      }
      // Otherwise, if this was a more serious error, log to the console with the details.
      else {
        sails.log.warn('res.serverError() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
      }
      return res.jsonx(data);
    }

    return res.send(html);
  });

};

