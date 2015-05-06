IMVU.Client.ShopCarouselController = function (spec) {
    var imvu = spec.imvu;
    var timer = spec.timer || timerRequired;
    var eventBus = spec.eventBus;

    var undoInProgress = false;

    var dressupHistory = [];
    var activeUndoStateIndex = 0;
    var shopTriedProducts = {};
    var actions = [];

    var carousel = null;

    var _shopTriedProductsChangedEvent = new YAHOO.util.CustomEvent("shopTriedProductsChanged");
    this.getShopTriedProductsTimeout = null;

    var isContinuationState = function(firstState, secondState) {
        var getPid = function(item) { return item.products_id; };
        var getPids = function(state) {
            if (jQuery.isEmptyObject(state)) { return []; }
            return state.notOwned.map(getPid).concat(state.owned.map(getPid)).concat(state.loading);
        };
        var firstItemPids = getPids(firstState).sort();
        var secondItemPids = getPids(secondState).sort();
        if (firstItemPids.length != secondItemPids.length) {
            return false;
        }
        for (var i=0; i<firstItemPids.length; ++i) {
            if (firstItemPids[i] != secondItemPids[i]) {
                return false;
            }
        }
        return true;
    };

    var updateAvatarState = function(eventName, obj) {
        var callback = function(state) {
            if (!undoInProgress) {
                var isContinuation = isContinuationState(state, shopTriedProducts);
                actions = imvu.call("getActions", null);

                // Add this state to the history array
                if (isContinuation && dressupHistory.length > 0) {
                    dressupHistory.pop();
                }
                dressupHistory.push(state);
            } else {
                // This is an undo; remove the state we undid, then in case our undo is processing, update the previous state.
                dressupHistory.splice(-2, 2, state);
            }
            shopTriedProducts = state;

            activeUndoStateIndex = dressupHistory.length - 1;
            
            if (carousel && carousel.undoLinkElement) {
                carousel.undoLinkElement.style.display = ((activeUndoStateIndex === 0) ? "none" : "block");
            }

            undoInProgress = false;

            _shopTriedProductsChangedEvent.fire(shopTriedProducts, actions);
        };

        if (this.getShopTriedProductsTimeout) {
            timer.clearTimeout(this.getShopTriedProductsTimeout);
        }

        this.getShopTriedProductsTimeout = timer.setTimeout(function() {
            IMVU.callAsync("getShopTriedProducts", callback, imvu);
        }, 500);
   }.bind(this);

   eventBus.register('SessionWindow.avatarClothingUpdated', updateAvatarState, 'SessionWindow', imvu.call);
   eventBus.register('SessionWindow.roomUpdated', updateAvatarState, 'SessionWindow', imvu.call);
   eventBus.register('RoomStateChanged', updateAvatarState, undefined, imvu.call);
   eventBus.register('InventoryChanged', updateAvatarState, undefined, imvu.call);
   eventBus.register('OutfitTotalUpdated', function(eventName, obj) {
        var price = obj.total;
        carousel.updateTotal(price);
        }, undefined, imvu.call);

   return {
       shopTriedProductsChangedEvent : _shopTriedProductsChangedEvent,

       getShopTriedProducts : function() {
            return shopTriedProducts;
       },
       
       getHistory : function() {
            return dressupHistory;
       },

       setCarousel : function(newCarousel) {
            carousel = newCarousel;
            this.shopTriedProductsChangedEvent.unsubscribeAll();
            this.shopTriedProductsChangedEvent.subscribe(carousel.updateItems, carousel, true);

            var self = this;
            var updateCallback = function() {
                if (IMVU.Client.Shop) {
                    IMVU.Client.Shop.mode.shopCarouselBuyController.update([self.getShopTriedProducts()]);
                }
            };
            this.shopTriedProductsChangedEvent.subscribe(updateCallback);
       },

       undo : function() {
            var indexOfUndoState = activeUndoStateIndex - 1;

            var currentStateItems = dressupHistory[activeUndoStateIndex];
            var undoStateItems = dressupHistory[indexOfUndoState];

            if (undoStateItems) {
                var undoAvatarItems = undoStateItems.sorted.avatar.owned.concat(undoStateItems.sorted.avatar.notOwned);
                var undoAvatarPids = undoAvatarItems.map(function(item) { return item.products_id; });

                var currentAvatarItems = currentStateItems.sorted.avatar.owned.concat(currentStateItems.sorted.avatar.notOwned);
                var currentAvatarPids = currentAvatarItems.map(function(item) { return item.products_id; });

                var filteredUndoAvatarPids = undoAvatarPids.filter(function(pid) {
                    return currentAvatarPids.indexOf(pid) === -1;
                });
                
                var filteredCurrentAvatarPids = currentAvatarPids.filter(function(pid) {
                    return undoAvatarPids.indexOf(pid) === -1;
                });
                
                var undoFurniItems = undoStateItems.sorted.furniture.owned.concat(undoStateItems.sorted.furniture.notOwned);
                var undoFurniPids = undoFurniItems.map(function(item) { return item.products_id; });

                var currentFurniItems = currentStateItems.sorted.furniture.owned.concat(currentStateItems.sorted.furniture.notOwned);
                var currentFurniPids = currentFurniItems.map(function(item) { return item.products_id; });

                var filteredUndoFurniPids = undoFurniPids.filter(function(pid) {
                    return currentFurniPids.indexOf(pid) === -1;
                });
                
                var filteredCurrentFurniPids = currentFurniPids.filter(function(pid) {
                    return undoFurniPids.indexOf(pid) === -1;
                });

                var undoRoomItems = undoStateItems.sorted.room.owned.concat(undoStateItems.sorted.room.notOwned);
                var undoRoomPids = undoRoomItems.map(function(item) { return item.products_id; });

                var currentRoomItems = currentStateItems.sorted.room.owned.concat(currentStateItems.sorted.room.notOwned);
                var currentRoomPids = currentRoomItems.map(function(item) { return item.products_id; });

                var filteredUndoRoomPids = undoRoomPids.filter(function(pid) {
                    return currentRoomPids.indexOf(pid) === -1;
                });
                
                var filteredCurrentRoomPids = currentRoomPids.filter(function(pid) {
                    return undoRoomPids.indexOf(pid) === -1;
                });                

                undoInProgress = true;
                
                var itemsToTakeOff = filteredCurrentAvatarPids.concat(filteredCurrentFurniPids);
                if (itemsToTakeOff.length > 0) {
                    imvu.call("takeOff", itemsToTakeOff.join(" "), false);
                }

                if (filteredUndoAvatarPids.length > 0) {
                    imvu.call("applyOutfit", null, undoAvatarPids, true);
                }

                var allRoomItems = undoStateItems.sorted.room.owned.concat(undoStateItems.sorted.room.notOwned);
                allRoomItems.forEach(function(item) {
                    imvu.call("tryOnForUndo", item.products_id);
                });
                
                if (filteredUndoFurniPids.length > 0) {
                    filteredUndoFurniPids.forEach(function(pid) {
                        imvu.call("tryOnForUndo", pid);
                    });
                }
            }
       },

       isUndoInProgress : function() {
            return undoInProgress;
       },

       _test_set_shopTriedProducts : function(products) {
            shopTriedProducts = products;
       },
   };
};
