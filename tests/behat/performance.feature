@app @javascript @performance
Feature: Measure performance.

  Background:
    Given the following "users" exist:
      | username |
      | student1 |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1        | 0        |
      | Course 2 | C2        | 0        |
      | Course 3 | C3        | 0        |
      | Course 4 | C4        | 0        |
      | Course 5 | C5        | 0        |
      | Course 6 | C6        | 0        |
      | Course 7 | C7        | 0        |
      | Course 8 | C8        | 0        |
      | Course 9 | C9        | 0        |
      | Course 10 | C10        | 0        |
      | Course 11 | C11        | 0        |
      | Course 12 | C12        | 0        |
      | Course 13 | C13        | 0        |
      | Course 14 | C14        | 0        |
      | Course 15 | C15        | 0        |
      | Course 16 | C16        | 0        |
      | Course 17 | C17        | 0        |
      | Course 18 | C18        | 0        |
      | Course 19 | C19        | 0        |
      | Course 20 | C20        | 0        |
    And the following "course enrolments" exist:
      | user     | course | role    |
      | student1 | C1     | student |
      | student1 | C2     | student |
      | student1 | C3     | student |
      | student1 | C4     | student |
      | student1 | C5     | student |
      | student1 | C6     | student |
      | student1 | C7     | student |
      | student1 | C8     | student |
      | student1 | C9     | student |
      | student1 | C10     | student |
      | student1 | C11     | student |
      | student1 | C12     | student |
      | student1 | C13     | student |
      | student1 | C14     | student |
      | student1 | C15     | student |
      | student1 | C16     | student |
      | student1 | C17     | student |
      | student1 | C18     | student |
      | student1 | C19     | student |
      | student1 | C20     | student |
    And the following "activities" exist:
      | activity | name            | intro                   | course | idnumber | option                       | section |
      | choice   | Choice course 1 | Test choice description | C1     | choice1  | Option 1, Option 2, Option 3 | 1       |

  Scenario: First Contentful Paint
    Given I start measuring "First Contentful Paint"
    When I launch the app runtime
    Then I should find "Welcome to the Moodle App!" in the app

    When I stop measuring "First Contentful Paint"
    Then "First Contentful Paint" should have taken less than 6 seconds

  Scenario: Time to Interactive
    Given I start measuring "Time to Interactive"
    When I launch the app runtime
    Then I should find "Welcome to the Moodle App!" in the app

    When I press "Skip" in the app
    Then I should not find "Skip" in the app
    And I should find "Connect to Moodle" in the app

    When I stop measuring "Time to Interactive"
    Then "Time to Interactive" should have taken less than 7 seconds

  Scenario: Total Blocking Time
    Given I launch the app runtime
    Then I should find "Welcome to the Moodle App!" in the app

    When I start measuring "Total Blocking Time"
    And I press "Skip" in the app
    Then I should not find "Skip" in the app
    And I should find "Connect to Moodle" in the app

    When I stop measuring "Total Blocking Time"
    Then "Total Blocking Time" should have taken less than 2 seconds

  Scenario: Login
    When I launch the app
    Then I should see "Connect to Moodle"
    But I should not see "Welcome to the Moodle App!"

    When I start measuring "Login"
    And I set the field "Your site" to "$WWWROOT" in the app
    And I press "Connect to your site" in the app
    And I log in as "student1"
    And I should find "Timeline" in the app

    When I stop measuring "Login"
    Then "Login" should have taken less than 10 seconds

  Scenario: Open Activity
    When I launch the app
    Then I should see "Connect to Moodle"
    But I should not see "Welcome to the Moodle App!"

    And I set the field "Your site" to "$WWWROOT" in the app
    And I press "Connect to your site" in the app
    And I log in as "student1"
    Then I press "My courses" in the app
    And I should find "Course 1" in the app

    When I reload the page
    And I start measuring "Open Activity"
    And I wait the app to restart
    Then I should find "Course 1" in the app

    When I enter the course "Course 1" in the app
    And I press "Choice course 1" in the app
    Then I should find "Option 1" in the app

    When I stop measuring "Open Activity"
    # TODO Check back to 7s or review perfect timings
    Then "Open Activity" should have taken less than 8 seconds
