/**
 * Created by Ruben Kleiman on 11/24/13.
 */

describe('horace homepage', function() {

    var testUsername = 'Ruben';
    var testPassword = 'Tsukiko1!';
    var testEmail = 'roothekoos@gmail.com';

    function testSignupField(modelName, inputText) {
        var input = element(by.input(modelName));
        expect(input.isDisplayed()).toBe(true);
        input.clear();
        input.sendKeys(inputText);
        expect(input.getAttribute('value')).toEqual(inputText);
    }
    function testSubmit(isEnabled) {
        var input = element(by.id('submit'));
        expect(input.isDisplayed()).toBe(true);
        expect(input.isEnabled()).toBe(isEnabled);
    }
    function testErrorMsg(msg) {
        var e = (msg !== undefined);
        expect(element(by.css('.error')).isDisplayed()).toBe(e);
        if (e) {
            expect(element(by.binding('signin.errorMessage')).getText()).toEqual(msg);
        }
    }

    it('signin elements visible', function () {
        browser.get('/index.html');
        expect(element(by.name('signinForm')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.name')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.password')).isDisplayed()).toBe(true);
        expect(element(by.id('submit')).isDisplayed()).toBe(true);
        expect(element(by.css('.error')).isDisplayed()).toBe(false);
        expect(element(by.id('create')).isDisplayed()).toBe(true);
        expect(element(by.id('browse')).isDisplayed()).toBe(true);
    });

    it('signing in', function() {
        browser.get('/index.html');
        testSubmit(false);

        // Username at least 3 chars
        testSignupField('signin.user.name', 'Ru');
        testSubmit(false);
        testErrorMsg('At least 3 characters');

        // Username no spaces
        testSignupField('signin.user.name', 'R u');
        testSubmit(false);
        testErrorMsg('Get username help');

        // Username no more than 32 characters
        testSignupField('signin.user.name', '123456789012345678901234567890123');
        testSubmit(false);
        testErrorMsg('No more than 32 characters');

        // Username correct
        testSignupField('signin.user.name', testUsername);
        testSubmit(false);
        testErrorMsg();

        // Password at least 8 characters
        testSignupField("signin.user.password", '1');
        testSubmit(false);
        testErrorMsg('At least 8 characters');

        // Password help
        testSignupField("signin.user.password", '12345678');
        testSubmit(false);
        testErrorMsg('Get password help');

        // Password help
        testSignupField("signin.user.password", '123456789012345678901234567890123');
        testSubmit(false);
        testErrorMsg('No more than 32 characters');

        // Password missing capital letter
        testSignupField("signin.user.password", 'tsukiko1!');
        testSubmit(false);

        // Password missing lowercase letter
        testSignupField("signin.user.password", 'TSUKIKO1!');
        testSubmit(false);

        // Password missing special character
        testSignupField("signin.user.password", 'TSUKIKO1');
        testSubmit(false);

        // Password missing numeric character
        testSignupField("signin.user.password", 'TSUKIKO!');
        testSubmit(false);

        // Password correct
        testSignupField("signin.user.password", testPassword);
        testSubmit(true);
        testErrorMsg();

        // Test submit button
        element(by.id('submit')).click();
    });

    it('go to signup page and all elements are visible', function () {
        browser.get('/index.html');

        expect(element(by.id('create')).isDisplayed()).toBe(true);
        element(by.id('create')).click();

        expect(element(by.name('signupForm')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.name')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.password')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.confirm')).isDisplayed()).toBe(true);
        expect(element(by.input('signin.user.email')).isDisplayed()).toBe(true);
        expect(element(by.id('submit')).isDisplayed()).toBe(true);
        expect(element(by.css('.error')).isDisplayed()).toBe(false);
    });

    it('signing up', function () {

        testSubmit(false);

        // Username at least 3 chars
        testSignupField('signin.user.name', 'Ru');
        testSubmit(false);
        testErrorMsg('At least 3 characters');

        // Username no spaces
        testSignupField('signin.user.name', 'R u');
        testSubmit(false);
        testErrorMsg('Get username help');

        // Username no more than 32 characters
        testSignupField('signin.user.name', '123456789012345678901234567890123');
        testSubmit(false);
        testErrorMsg('No more than 32 characters');

        // Username correct
        testSignupField('signin.user.name', testUsername);
        testSubmit(false);
        testErrorMsg();

        // Password at least 8 characters
        testSignupField("signin.user.password", '1');
        testSubmit(false);
        testErrorMsg('At least 8 characters');

        // Password help
        testSignupField("signin.user.password", '12345678');
        testSubmit(false);
        testErrorMsg('Get password help');

        // Password help
        testSignupField("signin.user.password", '123456789012345678901234567890123');
        testSubmit(false);
        testErrorMsg('No more than 32 characters');

        // Password missing capital letter
        testSignupField("signin.user.password", 'tsukiko1!');
        testSubmit(false);

        // Password missing lowercase letter
        testSignupField("signin.user.password", 'TSUKIKO1!');
        testSubmit(false);

        // Password missing special character
        testSignupField("signin.user.password", 'TSUKIKO1');
        testSubmit(false);

        // Password missing numeric character
        testSignupField("signin.user.password", 'TSUKIKO!');
        testSubmit(false);

        // Password correct but unconfirmed
        testSignupField("signin.user.password", testPassword);
        testSubmit(false);
        testErrorMsg();

        // Password confirmation started but not confirmed
        testSignupField("signin.user.confirm", 'T');
        testSubmit(false);
        testErrorMsg('Must confirm password');

        // Password confirmed
        testSignupField("signin.user.confirm", testPassword);
        testSubmit(false);

        // Email invalid
        testSignupField("signin.user.email", 'a');
        testSubmit(false);
        testErrorMsg('Email address invalid');

        // Email correct
        testSignupField("signin.user.email", testEmail);

        // Form validated
        testSubmit(true);
        testErrorMsg();

        // Test submit button
        element(by.id('submit')).click();
    });

//    describe('todo list', function() {
//        var todoList;
//
//        beforeEach(function() {
//            browser.get('http://www.angularjs.org');
//
//            todoList = element.all(by.repeater('todo in todos'));
//        });
//
//        it('should list todos', function() {
//            expect(todoList.count()).toEqual(2);
//            expect(todoList.get(1).getText()).toEqual('build an angular app');
//        });
//
//        it('should add a todo', function() {
//            var addTodo = element(by.model('todoText'));
//            var addButton = element(by.css('[value="add"]'));
//
//            addTodo.sendKeys('write a protractor test');
//            addButton.click();
//
//            expect(todoList.count()).toEqual(3);
//            expect(todoList.get(2).getText()).toEqual('write a protractor test');
//        });
//    });
});
