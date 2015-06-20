// https://github.com/meteor/meteor/tree/devel/packages/spacebars
// simple-todos.js
Tasks = new Mongo.Collection("tasks");
Names = new Mongo.Collection("names");
Teamates = new Mongo.Collection("teammates");

if (Meteor.isClient) {
  // This code only runs on the client
  // Replace the existing Template.body.helpers
  Template.body.helpers({
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    },
    status: function () {
      return Session.get('currentTask');
    },
    tasks: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
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
      Tasks.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Tasks.remove({_id: this._id});
    }
  });

  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
  Template.body.events({
    // Add to Template.body.events
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    },
    "click #AddName": function (event) {
      var firstname = $('input[name="firstname"]').val();
      var lastname = $('input[name="lastname"]').val();

      Names.insert({
        firstname: firstname,
        lastname: lastname,
        createdAt: new Date()
      });

      return false;
    },
    "submit #Add": function (event) {
      // This function is called when the new task form is submitted

      var text = event.target.text.value;
      var t = $(event.target.text);

      console.log(t.val());
      console.log(text);

      Tasks.insert({
        text: text,
        createdAt: new Date() // current time
      });

      // Clear form
      // event.target.text.value = "";
      t.val('');

      // Prevent default form submit
      return false;
    }
  });
}