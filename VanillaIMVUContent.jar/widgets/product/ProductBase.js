
IMVU.Client.widget.ProductBase = function() {};

IMVU.Client.widget.ProductBase.createTemplate = function(isShoppingTogether) {
    IMVU.Client.widget.ProductBase.template = document.createElement("div");
    var template = IMVU.Client.widget.ProductBase.template;
    template.className = "product";
    template.innerHTML = IMVU.Client.widget.ProductBase._createTemplate(isShoppingTogether);
};

IMVU.Client.widget.ProductBase._createTemplate = function(isShoppingTogether) {
    return '' +
'<div class="bd">' +
'    <div class="try-x clickable ui-event" data-ui-name="TryX"></div>' +
'    <div class="info">' +
'        <h3>Product Name</h3>' +
'        <div class="thumb clickable ui-event" data-ui-name="ThumbnailInfo">' +
'            <div class="info-button clickable ui-event" data-ui-name="InfoButton"></div>' +
'            <div class="flag-icon clickable ui-event" data-ui-name="FlagButton"></div>' +
'            <img src="" />' +
'            <div class="ap ui-event" data-ui-name="APIcon"></div>' +
'        </div>' +
'        <div class="new"></div>' +
'        <div class="price"><span class="original_price">12,345</span> <span class="current_price">1,234</span><span class="display-only">Display Only</span></div>' +
'    </div>' +
'    <div class="creator ui-event" data-ui-name="ProductCreator">' +
'        <h4><span>'+_T("by")+'</span> <a href="#">Chattynatty</a><img class="pro" src="../shop/img/pro.png" width="24" height="12" /></h4>' +
'    </div>' +
'</div>' +
'<div class="ft">' +
'    <div class="wishlist clickable ui-event" data-ui-name="AddToWishlist"></div>' +
'    <div class="buttons">' +
'        <div class="imvu-button level4 white-text dark-gray clickable suggest ui-event" data-ui-name="SuggestProduct">Suggest</div>' +
'        <div class="gift clickable ui-event" data-ui-name="GiftProduct">Gift</div>' +
'        <div class="cart clickable ui-event" data-ui-name="AddToCart"></div>' +
'        <div class="try clickable ui-event" data-ui-name="TryProduct">Try</div>' +
'        <div class="off clickable ui-event" data-ui-name="TryProduct">Off</div>' +
'        <div class="buy clickable ui-event" data-ui-name="BuyProduct">Buy</div>' +
'        <div class="display-only" disabled> </div>' +
'        <div class="you-own-this" disabled>Own</div>' +
'    </div>' +
'</div>';
};
