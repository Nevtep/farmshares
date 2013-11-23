define(["jquery","accountDataVM"], function($, Account){
  var userid = $("#userid").val()

  return {
    loggedIn: userid != "",
    account: userid != "" ? new Account(userid) : null
  };
});