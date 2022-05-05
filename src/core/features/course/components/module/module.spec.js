/// <reference types="cypress" />

context('Core Courses Module', () => {

    beforeEach(() => {
        cy.visit('/iframe.html?id=core-course-module--assignment');
    });

    it('Marks as done', () => {
        cy.contains('Mark as done').click();
        cy.contains('Done').should('be.visible');
    });

});
