<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

use Behat\Mink\Exception\DriverException;
use Behat\Mink\Exception\ExpectationException;

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

/**
 * Performance step definitions.
 */
class behat_performance extends behat_base {

    /**
     * @var array
     */
    private $timings = [];

    /**
     * Start timing an event.
     *
     * @When /^I start timing "([^"]+)"$/
     */
    public function i_start_timing(string $name) {
        $this->timings[$name] = ['start' => $this->now()];
    }

    /**
     * Stop timing an event.
     *
     * @When /^I stop timing "([^"]+)"$/
     */
    public function i_stop_timing(string $name) {
        if (!isset($this->timings[$name])) {
            throw new DriverException("Timing with name '$name' does not exist.");
        }

        $this->timings[$name]['end'] = $this->now();
    }

    /**
     * Assert how long a timed event took.
     *
     * @Then /^"([^"]+)" should have taken (less than|more than|exactly) (\d+(?:\.\d+)? (?:seconds|milliseconds))$/
     */
    public function a_timed_event_assertion(string $name, Closure $comparison, float $expectedtime) {
        if (!isset($this->timings[$name])) {
            throw new DriverException("Timing with name '$name' does not exist.");
        }

        $actualtime = $this->timings[$name]['end'] - $this->timings[$name]['start'];

        if (!call_user_func($comparison, $actualtime, $expectedtime)) {
            throw new ExpectationException(
                "Expected timing for '$name' failed! (took {$actualtime}ms)",
                $this->getSession()->getDriver()
            );
        }
    }

    /**
     * Store performance results.
     *
     * @Then /^I store performance logs$/
     */
    public function i_store_performance_logs() {
        global $CFG;

        $dumpsfolderpath = $CFG->dirroot . '/behatperformancedumps/';

        if (!file_exists($dumpsfolderpath)) {
            mkdir($dumpsfolderpath);
        }

        $performancelogs = [];
        foreach ($this->timings as $measure => $timings) {
            $performancelogs[$measure] = [
                'total' => $timings['end'] - $timings['start'],
            ];

            $performancelogs[$measure] = array_merge($performancelogs[$measure], $timings);
        }

        file_put_contents($dumpsfolderpath . time() . '.json', json_encode($performancelogs));
    }

    /**
     * Parse time.
     *
     * @Transform /^\d+(?:\.\d+)? (?:seconds|milliseconds)$/
     * @param string $text Time string.
     * @return float
     */
    public function parse_time(string $text): float {
        $spaceindex = strpos($text, ' ');
        $value = floatval(substr($text, 0, $spaceindex));

        switch (substr($text, $spaceindex + 1)) {
            case 'seconds':
                $value *= 1000;
                break;
        }

        return $value;
    }

    /**
     * Parse a comparison function.
     *
     * @Transform /^less than|more than|exactly$/
     * @param string $text Comparison string.
     * @return Closure
     */
    public function parse_comparison(string $text): Closure {
        switch ($text) {
            case 'less than':
                return function ($a, $b) {
                    return $a < $b;
                };
            case 'more than':
                return function ($a, $b) {
                    return $a > $b;
                };
            case 'exactly':
                return function ($a, $b) {
                    return $a === $b;
                };
        }
    }

    /**
     * Get current time.
     *
     * @return int Current time in milliseconds.
     */
    private function now(): int {
        return round(microtime(true) * 1000);
    }

}
