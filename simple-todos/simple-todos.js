// https://github.com/meteor/meteor/tree/devel/packages/spacebars
// simple-todos.js
Tasks = new Mongo.Collection("tasks");
Names = new Mongo.Collection("names");
Teamates = new Mongo.Collection("teammates");

if (Meteor.isServer) {
  // At the bottom of simple-todos.js, outside of the client-only block
  Meteor.methods({
    addTask: function (text) {
      // Make sure the user is logged in before inserting a task
      if (! Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }

      Tasks.insert({
        text: text,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username
      });
    },
    deleteTask: function (taskId) {
      Tasks.remove(taskId);
    },
    setChecked: function (taskId, setChecked) {
      Tasks.update(taskId, { $set: { checked: setChecked} });
    }
  });
}

if (Meteor.isClient) {
  // This code only runs on the client
  // Replace the existing Template.body.helpers
  Template.body.helpers({
    // currentUser: function () {return Meteor.uesr().username;},
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    },
    status: function () {
      return Session.get('currentTask');
    },
    tasks: function () {
      var searchObj = {};
      if (Session.get("task-status") == 'completed') {
         searchObj = {checked: true};
       } else if (Session.get("task-status") == 'uncompleted') {
          searchObj = {checked: {$ne: true}}; 
       }
       return Tasks.find(searchObj, {sort: {createdAt: -1}});
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    }
  });

  // In the client code, below everything else
  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Session.set('currentTask', this.text);
      Meteor.call("setChecked", this._id, ! this.checked);
      // Tasks.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
      // Tasks.remove({_id: this._id});
    }
  });

  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
  Template.body.events({
    // Add to Template.body.events
    "change input[name='task-status']": function (event) {
      var status = $('input[name="task-status"]:checked').data('filter'); // 'completed'
      Session.set("task-status", status);
    },
    "click #AddName": function (event) {
      var firstname = $('input[name="firstname"]').val();
      var lastname = $('input[name="lastname"]').val();
      /*
      Names.insert({
        firstname: firstname,
        lastname: lastname,
        createdAt: new Date()
      });
      */

      return false;
    },
    "submit #Add": function (event) {
      // This function is called when the new task form is submitted

      var text = event.target.text.value;
      var t = $(event.target.text);

      console.log(t.val());
      console.log(text);


      Meteor.call('addTask', text);

      /*
      Tasks.insert({
        text: text,
        createdAt: new Date(),            // current time
        owner: Meteor.userId(),           // _id of logged in user
        username: Meteor.user().username  // username of logged in user
      });
      */

      // Clear form
      // event.target.text.value = "";
      t.val('');

      // Prevent default form submit
      return false;
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}