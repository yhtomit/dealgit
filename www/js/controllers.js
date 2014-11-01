var app = angular.module('starter.controllers', ['ionic', 'angularFileUpload', 'starter.services', 'wu.masonry', 'ngTagsInput']);

app.controller('AppCtrl', ["$rootScope", "$scope", "$ionicModal", "$timeout", "$state", "opService",
    function($rootScope, $scope, $ionicModal, $timeout, $state, opService) {
        // State need to be saved in order to be used in template
        $scope.ionicState = $state;

        // Form data for the login modal
        $scope.loginData = {};

        // Form data for the register modal
        $scope.registerData = {};

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeLogin = function() {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.showLogin = function() {
            $scope.modal.show();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function() {
            opService.login($scope.loginData.username, $scope.loginData.password).success(
                function(data) {
                    if (data.state === 0) {
                        $scope.setLogin(data.sessionId + "#" + data.sessionKey);
                        $scope.closeLogin();

                        if ($state.current.name == "app.register" || $state.current.name == "app.register2") {
                            $scope.gotoList();
                        } else {
                            opService.refresh();
                        }
                    }
                }).error(function(data) {
                $scope.loginData.password = null;
                $scope.clearLogin();
                opService.alertError("登陆失败！");
                $scope.closeLogin();
            });
        };

        // Perform the register action when the user submits the register form
        $scope.doRegister = function() {
            opService.register($scope.registerData.username, $scope.registerData.password).success(
                function(data) {
                    if (data.state === 0) {
                        $scope.setLogin(data.sessionId + "#" + data.sessionKey);
                        $scope.gotoRegister2();
                    }
                }).error(function(data) {
                $scope.clearLogin();
                opService.alertError("注册失败！");
            });
        };

        // Clear the login status
        $scope.logout = function() {
            $scope.clearLogin();
            $scope.gotoList();
        };

        $scope.setLogin = function(token) {
            window.localStorage.token = token;
            $rootScope.LOGIN_STATUS = true;
        };

        $scope.clearLogin = function() {
            delete window.localStorage.token;
            $rootScope.LOGIN_STATUS = false;
        };

        $scope.isLoggedIn = function() {
            return $rootScope.LOGIN_STATUS;
        };

        $scope.register = function() {
            $scope.closeLogin();
            $scope.gotoRegister();
        };

        $scope.gotoRegister = function() {
            opService.transitionTo("app.register", true);
        };

        $scope.gotoRegister2 = function() {
            opService.transitionTo("app.register2", true);
        };

        $scope.gotoList = function() {
            opService.transitionTo("app.list", true);
        };

        $scope.gotoDetail = function(id) {
            opService.transitionTo("app.detail", false, {
                "postId": id
            });
        };

        $scope.gotoPost = function() {
            if (!$scope.isLoggedIn()) {
                $scope.showLogin();
            } else {
                opService.transitionTo("app.post");
            }
        };

        $scope.gotoComment = function(postId, replyId) {
            if (!$scope.isLoggedIn()) {
                $scope.showLogin();
            } else {
                opService.transitionTo("app.comment", false, {
                    "postId": postId,
                    "replyId": replyId
                });
            }
        };

        $scope.gotoBrowser = function(uri, extractFlag) {
            if (!$scope.isLoggedIn()) {
                $scope.showLogin();
            } else {
                $rootScope.ROOT_URI = uri;
                $rootScope.ROOT_EXTRACT_FLAG = extractFlag;
                opService.transitionTo("app.browser");
            }
        };

        if (window.localStorage.token && !$rootScope.LOGIN_STATUS) {
            $rootScope.LOGIN_STATUS = true;
            opService.getUserProfile();
        }
    }
]);

app.controller('ProfileCtrl', ["$rootScope", "$scope", "$ionicModal", "$timeout", "$upload", "opService",
    function($rootScope, $scope, $ionicModal, $timeout, $upload, opService) {
        $scope.profilePictureOriginal = null;
        $scope.profilePicture = null;

        opService.getUserProfile().success(
            function(data) {
                if (data.state === 0) {
                    if (data.profile.profilePicture) {
                        $scope.profilePictureOriginal = data.profile.profilePicture;
                        $scope.profilePicture = $scope.profilePictureOriginal + opService.CONSTS.DETAIL_SCALE;
                    }
                }
            });

        $scope.onProfilePictureUpload = function(files) {
            if (files) 
            {
                console.log("fd");
                $scope.uploadfile = true;
                var file = files[0];
                $upload.upload({
                    url: opService.CONSTS.FILE_UPLOAD_SERVICE,
                    file: file,
                    progress: function(e) {
                    }
                }).then(function(data, status, headers, config) {
                    $scope.uploadfile = false;
                    if (data.data.uploaded) {
                        for (var key in data.data.uploaded) {
                            $scope.profilePictureOriginal = data.data.uploaded[key];
                            $scope.profilePicture = $scope.profilePictureOriginal + opService.CONSTS.DETAIL_SCALE;
                        }
                    }
                });
            }
        };

        // Perform the register action when the user submits the register form
        $scope.doUpdateProfile = function() {
            opService.updateUserProfile($scope.profilePictureOriginal, $scope.email, $scope.mobile).success(
                function(data) {
                    if (data.state === 0) {
                        $scope.gotoList();
                    }
                }).error(function(data) {
                opService.alertError("更换头像失败！");
            });
        };
    }
]);

app.controller('ListCtrl', ["$scope", "$rootScope", "opService",
    function($scope, $rootScope, opService) {
        $scope.$on('scroll.infiniteScrollComplete', function() {
            var container = document.querySelector('.masonry-container');
            if (container) {
                var msnry = new Masonry(container, {
                    // options
                    itemSelector: '.list-masonry'
                });
            }
        });

        $scope.clearDeals = function() {
            $scope.fromCount = 0;
            $scope.fromTs = 0;
            $scope.canLoadFlag = true;
            $scope.deals = [];
            $scope.dd = {};
        };
        $scope.canLoad = function() {
            return $scope.canLoadFlag;
        };
        $scope.load = function() {
            opService.getDeals($scope.listMode, $scope.fromCount, $scope.fromTs).success(
                function(data) {
                    if (data.state === 0) {
                        if (!data.deals.length) {
                            $scope.canLoadFlag = false;
                        } else {
                            for (var idx in data.deals) {
                                var arrItem = data.deals[idx];
                                var item = opService.convertDealItem(arrItem);
                                if (!$scope.dd[item.id]) {
                                    $scope.dd[item.id] = true;

                                    $scope.fromTs = arrItem.postTime;
                                    $scope.fromCount++;

                                    $scope.deals.push(item);
                                }
                            }
                        }


                    } else {
                        opService.alertError("载入失败！");
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        };

        $scope.switchToPopular = function() {
            $scope.listMode = "popular";
            $scope.clearDeals();
        };

        $scope.switchToLatest = function() {
            $scope.listMode = "latest";
            $scope.clearDeals();
        };

        $scope.gridViewClick = function() {
            $('.page-content').removeClass('thumb-view');
            document.getElementById('grid_view_img').src = 'image/grid-view-active.png';
            document.getElementById('thumb_view_img').src = 'image/thumb-view.png';
        };
        $scope.thumbViewClick = function() {
            $('.page-content').addClass('thumb-view');
            document.getElementById('grid_view_img').src = 'image/grid-view.png';
            document.getElementById('thumb_view_img').src = 'image/thumb-view-active.png';
        };
        $scope.switchToLatest();

        $scope.load();
    }
]);


app.controller('DetailCtrl', ["$scope", "$rootScope", "$state", "opService", "$ionicSlideBoxDelegate",
    function($scope, $rootScope, $state, opService, $ionicSlideBoxDelegate) {
        $scope.fromTs = 0;
        $scope.comments = [];
        $scope.cd = {};
        $scope.deal = {};
        $scope.canLoadFlag = true;

        $scope.commentData = {};

        $scope.load = function() {
            opService.getDealDetail($state.params.postId).success(
                function(data) {
                    if (data.state === 0) {
                        $scope.deal = opService.convertDealItem(data.deal);
                        $ionicSlideBoxDelegate.update();
                        opService.getDealComments($state.params.postId, $scope.fromTs).success(
                            function(data) {
                                if (data.state === 0) {
                                    if (!data.comments.length) {
                                        $scope.canLoadFlag = false;
                                    } else {
                                        for (var idx in data.comments) {

                                            var arrItem = data.comments[idx];
                                            var item = opService.convertCommentItem(arrItem);

                                            if (!$scope.cd[item.id]) {
                                                $scope.cd[item.id] = true;

                                                $scope.fromTs = arrItem.commentTime;
                                                $scope.comments.push(item);
                                            }

                                        }
                                    }

                                } else {
                                    console.log(data);
                                    //alert("载入评论失败！");
                                }
                                $scope.$broadcast('scroll.infiniteScrollComplete');
                            });

                    } else {
                        console.log(data);
                        //alert("载入详细信息失败！");
                    }
                });
        };
        $scope.canLoad = function() {
            return $scope.canLoadFlag;
        };
        $scope.postComment = function() {
            opService.postDealComment($state.params.postId, $scope.commentData.title, $scope.commentData.comment, $state.params.replyId).success(
                function(data) {
                    if (data.state === 0) {
                        opService.transitionTo("app.detail", false, {
                            "postId": $state.params.postId
                        });
                    } else {
                        opService.alertError("评论失败");
                    }
                });

        };

        $scope.lastClicked = -1;

        $scope.clickUp = function() {
            if (!$scope.isLoggedIn()) {
                $scope.showLogin();
                return;
            }

            if ($scope.deal && moment().unix() - $scope.lastClicked > 10) {
                $scope.lastClicked = moment().unix();

                if ($scope.deal.voteUpFlag) {
                    opService.voteCancel($state.params.postId).success(
                        function(data) {
                            if (data.state === 0) {
                                $scope.deal.voteUpFlag = false;
                                $scope.deal.upCount--;

                            } else {
                                alert("取消投票失败");
                            }

                            $scope.lastClicked = -1;
                        });
                } else {
                    opService.voteUp($state.params.postId).success(
                        function(data) {
                            if (data.state === 0) {
                                $scope.deal.voteUpFlag = true;
                                $scope.deal.upCount++;

                                if ($scope.deal.voteDownFlag) {
                                    $scope.deal.voteDownFlag = false;
                                    $scope.deal.downCount--;
                                }

                            } else {
                                alert("投票失败");
                            }

                            $scope.lastClicked = -1;
                        });
                }
            }
        };

        $scope.clickDown = function() {
            if (!$scope.isLoggedIn()) {
                $scope.showLogin();
                return;
            }

            if ($scope.deal && moment().unix() - $scope.lastClicked > 10) {
                $scope.lastClicked = moment().unix();

                if ($scope.deal.voteDownFlag) {
                    opService.voteCancel($state.params.postId).success(
                        function(data) {
                            if (data.state === 0) {
                                $scope.deal.voteDownFlag = false;
                                $scope.deal.downCount--;

                            } else {
                                alert("取消投票失败");
                            }

                            $scope.lastClicked = -1;
                        });
                } else {
                    opService.voteDown($state.params.postId).success(
                        function(data) {
                            if (data.state === 0) {
                                $scope.deal.voteDownFlag = true;
                                $scope.deal.downCount++;

                                if ($scope.deal.voteUpFlag) {
                                    $scope.deal.voteUpFlag = false;
                                    $scope.deal.upCount--;
                                }

                            } else {
                                alert("投票失败");
                            }

                            $scope.lastClicked = -1;
                        });
                }
            }
        };
        $scope.load();
    }
]);

app.controller('PostCtrl', ["$scope", "$rootScope", "$upload", "opService",
    function($scope, $rootScope, $upload, opService) {
        $scope.deal = {};

        if ($rootScope.ROOT_DEAL) {
            if ($rootScope.ROOT_DEAL.uri) {
                $scope.deal.uri = $rootScope.ROOT_DEAL.uri;
            }
            if ($rootScope.ROOT_DEAL.vendor) {
                $scope.deal.vendor = $rootScope.ROOT_DEAL.vendor;
            }
            if ($rootScope.ROOT_DEAL.title) {
                $scope.deal.title = $rootScope.ROOT_DEAL.title;
            }
            if ($rootScope.ROOT_DEAL.regularPrice) {
                $scope.deal.regularPrice = $rootScope.ROOT_DEAL.regularPrice;
            }
            if ($rootScope.ROOT_DEAL.discountedPrice) {
                $scope.deal.discountedPrice = $rootScope.ROOT_DEAL.discountedPrice;
            }

            delete($rootScope.ROOT_DEAL);
        }

        $scope.$watch('deal.vendor', function() {
            if ($scope.deal.vendor && opService.CONSTS.VENDOR_URI_START[$scope.deal.vendor]) {
                $scope.deal.vendorUri = opService.CONSTS.VENDOR_URI_START[$scope.deal.vendor];
            }
        }, true);

        $scope.onDealPictureUpload = function($files) {
            $scope.pictureUrls = [];

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                $upload.upload({
                    url: opService.CONSTS.FILE_UPLOAD_SERVICE,
                    file: $file,
                    progress: function(e) {}
                }).then(function(data, status, headers, config) {
                    if (data.data.uploaded) {
                        for (var key in data.data.uploaded) {
                            $scope.pictureUrls.push(data.data.uploaded[key]);
                        }
                    }
                });
            }
        };

        $scope.postDeal = function() {
            opService.postDeal($scope.deal, $scope.pictureUrls).success(
                function(data) {
                    if (data.state === 0) {
                        opService.transitionTo("app.list", true);
                    } else {
                        opService.alertError(JSON.stringify(data.errorMessages));
                    }
                });

        };
    }
]);

app.controller('BrowserCtrl', ["$scope", "$rootScope", "$upload", "opService", "$ionicNavBarDelegate", "$sce",
    function($scope, $rootScope, $upload, opService, $ionicNavBarDelegate, $sce) {
        $scope.clickSubmit = function() {
            if ($scope.input.srco && !$scope.input.srco.match("^http[s]?://")) {
                $scope.input.srco = "http://" + $scope.input.srco;
            }

            $scope.input.src = $sce.trustAsResourceUrl($scope.input.srco);
        };

        $scope.clickBack = function() {
            var externalContent = document.getElementById('ifm').contentWindow;
            if (externalContent) {
                var content = externalContent.document.body.innerHTML;
                var url = externalContent.location.href;
                var title = externalContent.document.getElementsByTagName("title")[0].innerHTML.trim();

                var matches;
                var myRegexp;
                var vendor = "";
                var regularPrice;
                var discountedPrice;

                myRegexp = /^(http:\/\/m.jd.com\/product\/\d+\.html).*/g;
                matches = myRegexp.exec(url);
                if (matches) {
                    vendor = "京东";
                    url = matches[1];

                    var arr = title.split("\n");
                    title = arr[0].trim();

                    discountedPrice = parseFloat(externalContent.document.getElementById("price").innerHTML.trim().replace("¥", "").trim());

                }


                $rootScope.ROOT_DEAL = {
                    'uri': url,
                    'title': title,
                    'vendor': vendor,
                    'regularPrice': regularPrice,
                    'discountedPrice': discountedPrice
                };
            }
            $ionicNavBarDelegate.back();
        };

        $scope.input = {
            'srco': $rootScope.ROOT_URI,
            'extractFlag': $rootScope.ROOT_EXTRACT_FLAG,
            'windowHeight': window.innerHeight - 160
        };

        delete($rootScope.ROOT_URI);
        delete($rootScope.ROOT_EXTRACT_FLAG);

        $scope.clickSubmit();
        $scope.canGoBack = false;

        if ($scope.$viewHistory.backView) {
            $scope.canGoBack = true;
        }

        $scope.buttonText = "获取并返回";
        if (!$scope.input.extractFlag) {
            $scope.buttonText = "返回";
        }
    }
]);
