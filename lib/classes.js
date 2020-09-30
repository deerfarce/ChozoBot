"use strict";

//queue items like this:
//AutoFnQueueObject.enqueue([this (context), fn_name, [argument0, argument1, ...]])

/**
 * Class which allows automatic queueing of actions with a specified interval time.
 * @constructor
 * @param  {number} interval Amount of time between actions in milliseconds.
 */
function AutoFnQueue(interval) {
  if (typeof interval !== "number" || interval < 0) {
    throw new TypeError("AutoFnQueue: interval must be a positive number!");
  }
  this.items = [];
  this.interval = interval;
  this.flushing = false;
  this.intervalId = null;
}

/**
 * Enqueue an item and begin flushing the queue, if not flushing already.
 *
 * @param  {any[]} item Array consisting of context, the function to execute, and an array of arguments to apply to the function if needed, in that order.
 */
AutoFnQueue.prototype.enqueue = function(item) {
  this.items.push(item);
  this.flush();
}


/**
 * Shifts the first item from the queue and returns it.
 *
 * @return {any[]}  Queue item
 */
AutoFnQueue.prototype.dequeue = function() {
  if (!this.isEmpty()) return this.items.shift();
}

/**
 * Check if the queue is empty.
 *
 * @return {boolean}  True if empty, false otherwise.
 */
AutoFnQueue.prototype.isEmpty = function() {
  return this.items.length <= 0;
}

/**
 * Gets the first item from the queue but does not remove it.
 *
 * @return {any[]}  Queue item
 */
AutoFnQueue.prototype.peek = function() {
  return this.items[0];
}

/**
 * Begins flushing the queue if it has not been started already.
 */
AutoFnQueue.prototype.flush = function() {
  if (this.flushing || this.isEmpty()) return;
  this.flushing = true;
  var item = this.dequeue();
  item[1].apply(item[0], item[2]);
  this.intervalId = setInterval(()=> {
    if (this.isEmpty()) {
      this.interrupt();
    } else {
      var item = this.dequeue();
      item[1].apply(item[0], item[2]);
    }
  }, this.interval)
}

/**
 * Stops flushing the queue immediately and leaves the rest of the queued items waiting.
 */
AutoFnQueue.prototype.interrupt = function() {
  if (this.intervalId) clearInterval(this.intervalId);
  this.intervalId = null;
  this.flushing = false;
}


/**
 * Interrupts and clears the queue.
 */
AutoFnQueue.prototype.clearQueue = function() {
  this.interrupt();
  this.items = [];
}

module.exports = {
  "AutoFnQueue":AutoFnQueue
}
