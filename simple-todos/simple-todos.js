// https://github.com/meteor/meteor/tree/devel/packages/spacebars
// simple-todos.js
Tasks = new Mongo.Collection("tasks");
Names = new Mongo.Collection("names");
Teamates = new Mongo.Collection("teammates");

if (Meteor.isServer) {
  // At the bottom of simple-todos.js, outside of the client-only block
  Meteor.methods({
    addTask: function (text, priority) {
      // Make sure the user is logged in before inserting a task
      if (! Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }

      Tasks.insert({
        text: text,
        priority: priority,
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
    },
    setEditing: function (taskId, isEditing) {
      Tasks.update(taskId, {$set: {editing: isEditing}});
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
    },
    "click .priority-txt": function (event) {
      Meteor.call('setEditing', this._id, !this.editing);
    }
  });

  Template.task.helpers({
    priorityDesc: function () {
      switch (this.priority) {
      case '1':
        return '重要'
      case '2':
        return '一般'
      case '3':
        return '不重要'
      }
      return '无优先级'
    }
  })

  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
  Template.body.events({
    // Add to Template.body.events
    "change input[name='task-status']": function (event) {
      var status = $('input[name="task-status"]:checked').data('filter'); // 'completed'
      Session.set("task-status", status);
    },
    "submit #Add": function (event) {
      var text = event.target.text.value;
      var priority = $("select[name='priority']").val();
      Meteor.call('addTask', text, priority);
      event.target.text.value = '';
      // Prevent default form submit
      return false;
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}