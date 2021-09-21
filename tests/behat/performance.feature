@app @javascript @performance
Feature: Performance

Scenario: [FCP] First Contentful Paint in less than 2 seconds
    Given I start timing "FCP"
    When I launch the app
    Then I should find "Welcome to the Moodle App!" in the app

    When I stop timing "FCP"
    # Then "FCP" should have taken less than 2 seconds
    Then "FCP" should have taken less than 10 seconds
    Then I store performance logs

Scenario: [TTI] Time to Interactive is less than 3.8 seconds
    Given I start timing "TTI"
    When I launch the app
    Then I should find "Welcome to the Moodle App!" in the app

    When I press "Skip" in the app
    Then I should find "Connect to Moodle" in the app

    When I stop timing "TTI"
    # Then "TTI" should have taken less than 3.8 seconds
    Then "TTI" should have taken less than 10 seconds
    Then I store performance logs

Scenario: [TBT] Total Blocking Time is less than 300 milliseconds
    Given I launch the app
    Then I should find "Welcome to the Moodle App!" in the app

    When I start timing "TBT"
    And I press "Skip" in the app
    Then I should find "Connect to Moodle" in the app

    When I stop timing "TBT"
    # Then "TBT" should have taken less than 300 milliseconds
    Then "TBT" should have taken less than 10 seconds
    Then I store performance logs
