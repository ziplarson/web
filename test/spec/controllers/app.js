'use strict';

describe('Controllers', function () {

    var $scope, ctrl, signInFieldDirective;

//    beforeEach(angular.mock.module('ngMockE2E'));
    beforeEach(module('horaceApp'));

    describe('SigninCtrl', function () {

        beforeEach(inject(function ($rootScope, $controller) {
            $scope = $rootScope.$new();
            $scope.signin = {};
            ctrl = $controller('SigninCtrl', {$scope: $scope});
            console.log($controller);
        }));

        it('check initialization', function () {
            expect($scope.signin).toBeDefined();
            expect($scope.submit).toBeDefined();
        });

        it('check username validation', function () {
            $scope.signin.user = {name: 'ruben', password: 'Tsukiko1!'};
//            expect(ctrl.$valid).toBe(true);
        });

        // Check signin verification directive
        // Check signin verification directive
//        describe('signinField directive', function () {
//            beforeEach(inject(function ($templateCache,_$compile_,_$rootScope_) {
//                console.log(_$rootScope_);
//            }));
//
//            it('check username validation', function () {
//                expect(true).toBe(true);
//            });
//        });
    });
});

//describe('Services', function () {
//
//    beforeEach(module('horaceApp'));
//
//    var service;
//
//    beforeEach(inject(function (Bull) {
//        service = Bull;
//    }));
//
//    it('expect something', function () {
//        console.log(service);
//    });
//});
