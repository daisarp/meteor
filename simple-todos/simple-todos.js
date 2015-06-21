// https://github.com/meteor/meteor/tree/devel/packages/spacebars
// simple-todos.js
Tasks = new Mongo.Collection("tasks");
Names = new Mongo.Collection("names");
Teamates = new Mongo.Collection("teammates");

if (Meteor.isServer) {
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });

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
      var task = Tasks.findOne(taskId);
      if (task.private && task.owner !== Meteor.userId()) {
        // If the task is private, make sure only the owner can delete it
        throw new Meteor.Error("not-authorized");
      }
    },
    setChecked: function (taskId, setChecked) {
      var task = Tasks.findOne(taskId);
      if (task.private && task.owner !== Meteor.userId()) {
        // If the task is private, make sure only the owner can check it off
        throw new Meteor.Error("not-authorized");
      }
    },
    setEditing: function (taskId, isEditing) {
      Tasks.update(taskId, {$set: {editing: isEditing}});
    },
    setPriority: function (taskId, priority) {
      Tasks.update(taskId, {$set: {priority: priority}});
    },
    // Add a method to Meteor.methods called setPrivate
    setPrivate: function (taskId, setToPrivate) {
      var task = Tasks.findOne(taskId);

      // Make sure only the task owner can make a task private
      if (task.owner !== Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }
      Tasks.update(taskId, { $set: { private: setToPrivate } });
    }
  });
}

var priorityMap = {
  '1': '重要',
  '2': '一般',
  '3': '不重要'
};

if (Meteor.isClient) {
  Meteor.subscribe("tasks");

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
    },
    "change select[name='priority']": function (event) {
      var value = $(event.target).val();
      if (value) {
        Meteor.call('setPriority', this._id, value);
      }
      Meteor.call('setEditing', this._id, !this.editing);
    },
    // Add an event for the new button to Template.task.events
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Template.task.helpers({
     isOwner: function () {
      return this.owner === Meteor.userId();
    },
    priorityDesc: function () {
      return priorityMap[this.priority] || '';
    }
  })

  Template.priority.helpers({
    pSelected: function (priority) {
      console.log(priority)
      return this.priority == priority ? 'selected' : '';
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
      var $select = $("select[name='priority']");
      Meteor.call('addTask', text, $select.val());
      event.target.text.value = '';
      $select.val('1');

      // Prevent default form submit
      return false;
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}