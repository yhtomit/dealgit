var app = angular.module('starter.services', []);

app.factory('opService', ["$http", "$rootScope", "$state", "$ionicModal", "$ionicViewService",
    function($http, $rootScope, $state, $ionicModal, $ionicViewService) {

        this.SERVICE_HOST = 'http://ds.noyogo.com/REST';
        //this.SERVICE_HOST = 'http://localhost/dealserver/REST';
        this.LIST_SCALE = "@1e_174w_174h_1c_0i_1o_90Q_1x.jpg";
        this.DETAIL_SCALE = "@1e_378w_400h_1c_0i_1o_90Q_1x.jpg";

        this.VENDOR_URI_START = {
            "天猫": "http://www.tmall.com/",
            "淘宝": "http://m.taobao.com",
            "京东": "http://m.jd.com"
        };

        var self = this;

        var ret = {
            alertError: function(msg) {
                alert(msg);
            },
            transitionTo: function(state, clearFlag, params, options) {
                if (clearFlag) {
                    $ionicViewService.nextViewOptions({
                        disableBack: true
                    });
                }
                $state.transitionTo(state, params, options);
            },
            refresh: function() {
                $state.go($state.current, {}, {
                    reload: true
                });
            },
            convertDealItem: function(arrItem) {
                // TMP SOLUTION FOR NOW UNTIL WE HAVE MANAGEMENT OF VENDORS
                var COLORS = {
                    "": "color-others",
                    "天猫": "color-tm",
                    "淘宝": "color-tb",
                    "京东": "color-jd",
                    "点评": "color-dp"
                };
                var NEW_FLAG_SECONDS = 86400;
                var POPULAR_COUNTS = 50;
                var MOST_LIKED_COUNT = 1;

                var item = JSON.parse(JSON.stringify(arrItem));
                item.raw = arrItem;

                if (arrItem.vendor) {
                    item.vendorColor = COLORS[item.vendor] ? COLORS[item.vendor] : COLORS[""];
                }

                if (arrItem.discountedPrice && arrItem.discountedPrice > 0) {
                    item.textInRed = "¥" + arrItem.discountedPrice;
                    item.discountedPrice = parseFloat(arrItem.discountedPrice);
                    if (arrItem.regularPrice) {
                        item.textInGray = "¥" + arrItem.regularPrice;
                        item.regularPrice = parseFloat(arrItem.regularPrice);
                        if (arrItem.discountedPrice / arrItem.regularPrice <= 0.8) {
                            var dis = Math.floor(arrItem.discountedPrice / arrItem.regularPrice * 100) / 10;
                            item.textInRed = dis + "折";
                        }
                    }
                }

                item.postTimeDisplay = moment(arrItem.postTime / 1000).fromNow();
                if (moment().unix() - arrItem.postTime / 1000000 <= NEW_FLAG_SECONDS) {
                    item.newFlag = true;
                }
                if (arrItem.readCount >= POPULAR_COUNTS) {
                    item.popularFlag = true;
                }
                if (arrItem.upCount >= MOST_LIKED_COUNT) {
                    item.likeFlag = true;
                }
                if (arrItem.pictures && arrItem.pictures.length) {
                    item.pictureFirstListScaled = arrItem.pictures[0].pictureUrl + self.LIST_SCALE;
                    item.pictureFirstDetailScaled = arrItem.pictures[0].pictureUrl + self.DETAIL_SCALE;
                    for (var idx in arrItem.pictures) {
                        item.pictures[idx].pictureUrlListScaled = arrItem.pictures[idx].pictureUrl + self.LIST_SCALE;
                        item.pictures[idx].pictureUrlDetailScaled = arrItem.pictures[idx].pictureUrl + self.DETAIL_SCALE;
                    }
                }
                if (arrItem.authorPicture) {
                    item.authorPictureScaled = arrItem.authorPicture + self.LIST_SCALE;
                }

                if (arrItem.currentVote > 0) {
                    item.voteUpFlag = true;
                }

                if (arrItem.currentVote < 0) {
                    item.voteDownFlag = true;
                }

                if (item.uri && !item.uri.match("^http[s]?://")) {
                    item.uri = "http://" + item.uri;
                }


                return item;
            },
            convertCommentItem: function(arrItem) {
                var item = JSON.parse(JSON.stringify(arrItem));
                item.raw = arrItem;

                item.commentTimeDisplay = moment(arrItem.commentTime / 1000).calendar();

                if (arrItem.replyId) {
                    item.replyFlag = true;
                    item.replyId = arrItem.replyId;
                    item.repliedAuthorId = arrItem.repliedComment.authorId;
                    item.repliedAuthorName = arrItem.repliedComment.authorName;
                    item.repliedComment = arrItem.repliedComment.comment;
                    item.repliedTitle = arrItem.repliedComment.title;
                }
                if (arrItem.authorPicture) {
                    item.authorPictureScaled = arrItem.authorPicture + self.LIST_SCALE;
                }
                return item;
            },
            getDeals: function(mode, fromCount, fromTs) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + mode,
                    method: 'GET',
                    params: {
                        from: (mode == "latest") ? fromTs : fromCount
                    }
                });
            },
            getDealDetail: function(postId) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId,
                    method: 'GET'
                });
            },
            getDealComments: function(postId, fromTs) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId + "/comments",
                    method: 'GET',
                    params: {
                        from: fromTs
                    }
                });
            },
            voteUp: function(postId) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId + "/voteUp",
                    method: 'POST'
                });
            },
            voteDown: function(postId) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId + "/voteDown",
                    method: 'POST'
                });
            },
            voteCancel: function(postId) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId + "/voteCancel",
                    method: 'POST'
                });
            },
            register: function(username, password) {
                var psH = CryptoJS.MD5(password);
                return $http({
                    url: self.SERVICE_HOST + '/account',
                    method: 'POST',
                    data: {
                        username: username,
                        password: psH.toString()
                    }
                });
            },
            login: function(username, password) {
                var psH = CryptoJS.MD5(password);
                return $http({
                    url: self.SERVICE_HOST + '/account/login',
                    method: 'POST',
                    data: {
                        username: username,
                        password: psH.toString()
                    }
                });
            },
            getUserProfile: function() {
                return $http({
                    url: self.SERVICE_HOST + '/account/profile',
                    method: 'GET'
                });
            },
            updateUserProfile: function(picture, email, mobile) {
                return $http({
                    url: self.SERVICE_HOST + '/account/profile',
                    method: 'POST',
                    data: {
                        picture: picture,
                        email: email,
                        mobile: mobile
                    }
                });
            },
            postDeal: function(deal, pictureUrls) {
                return $http({
                    url: self.SERVICE_HOST + '/deals',
                    method: 'POST',
                    data: {
                        deal: deal,
                        pictureUrls: pictureUrls
                    }
                });
            },
            postDealComment: function(postId, title, comment, replyId) {
                return $http({
                    url: self.SERVICE_HOST + '/deals/' + postId + "/comments",
                    method: 'POST',
                    data: {
                        title: title,
                        comment: comment,
                        replyId: replyId
                    }
                });
            },
            CONSTS: {
                'FILE_UPLOAD_SERVICE': self.SERVICE_HOST + '/pictures',
                'LIST_SCALE': self.LIST_SCALE,
                'DETAIL_SCALE': self.DETAIL_SCALE,
                'VENDOR_URI_START': self.VENDOR_URI_START
            }
        };

        return ret;
    }
]);
