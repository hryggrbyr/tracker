Using the below code as an example, give me a reusable linechart component that will show consumption per year for the given media. I can then include one on each media page at the top above the menu (/books, /movies, /series)

---
{% set years = books.booksByYear | dictsort(true) | reverse %}
{% set curryr = years[0][0] %}

{# --- Calculate total books read this year --- #}
{% set booksThisYear = years[0][1] | length %}
{% set lastYear = years[0][0] %}
{% set firstYear = years[years.length - 1][0] %}

{% set maxValueLine = 0 %}
{% for year in years %}
  {% set count = year[1] | length %}
  {% if count > maxValueLine %}
    {% set maxValueLine = count %}
  {% endif %}
{% endfor %}

{% set points = [] %}
{% for year in years | reverse %}
  {% set count = year[1] | length %}
  {% set x = loop.index0 / (years | length - 1) * 200 %}
  {% set y = 100 - (count / maxValueLine * 100) %}
  {% set _ = points.push({ year: year[0], count: count, x: x, y: y}) %}
{% endfor %}

<style>
.chart-section {

}
/* === Reading Progress === */
.progress-wrapper progress {
  width: 100%;
  height: 1.75rem;
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: transparent;
}
progress::-webkit-progress-bar { background-color: transparent; }
progress::-webkit-progress-value {
  background: var(--bar-color);
  transition: width 1.2s ease;
}
progress::-moz-progress-bar {
  background: var(--bar-color);
}

/* === Responsive Line Chart === */
.linechart {
    width: auto;
    max-width: 100%;
    max-height: 66vh;
    overflow: visible;
    display: block;
}

.linechart polyline {
    aspect-ratio: 2/1;
    fill: none;
    stroke: var(--color-roygbiv-o);
    stroke-linecap: round;
    stroke-linejoin: round;
    height: 100%;
    margin-inline-end: auto;
}

.linechart circle {
    fill: var(--color-roygbiv-o);
    stroke: var(--color-background);
}

.linechart text {
    fill: var(--color-glass); /* not 'color' */
    font-weight: bold;
    text-anchor: middle;
    dominant-baseline: middle;
}

.chart-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    opacity: 0.7;
    list-style: none;
    padding: 0;
    width: 100%;
}
/* === Horizontal Bar Chart === */
.chart-horizontal {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.bar {
  position: relative;
  width: 100%;
}
.bar .meter {
    position: relative;
    display: block;
  width: 0;
  min-width: 2rem;
  height: 1.75rem;
  animation: growBar 1000ms ease forwards;
  border-radius: 0;
}
.bar .meter:after {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 4px;
    background-color: var(--color-roygbiv-i);
    border-radius: var(--radius-full);
}
.bar .meter:nth-child(1) { animation-delay: 0s; }
.bar .meter:nth-child(2) { animation-delay: 0.15s; }
.bar .meter:nth-child(3) { animation-delay: 0.3s; }
.bar .meter:nth-child(4) { animation-delay: 0.45s; }
.bar .meter:nth-child(5) { animation-delay: 0.6s; }
.bar .meter:nth-child(6) { animation-delay: 0.75s; }
.bar .meter:nth-child(7) { animation-delay: 0.9s; }
.bar .meter:nth-child(8) { animation-delay: 1.05s; }
.bar .meter:nth-child(9) { animation-delay: 1.2s; }
.bar .meter:nth-child(10) { animation-delay: 1.35s; }
@keyframes growBar { from { width: 0; } to { width: var(--value); } }
.bar .label { position: absolute; left: 0.5rem; top: 50%; transform: translate(0, -50%); color: currentColor; white-space: nowrap; }
.bar .label::first-letter { text-transform: uppercase; }
.bar .count { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); color: currentColor; }
</style>

<!-- === Reading Progress === -->
<section class="progress-wrapper flow">
   <h3>Reading Progress for {{ years[0][0] }}</h3>
  <div class="progress-label">
    {{ booksThisYear }}/{{ me.readingGoal }} books ({{ ((booksThisYear / me.readingGoal) * 100) | round }}%)
  </div>
  <progress style="--bar-color: var(--color-roygbiv-{{ 'g' if (booksThisYear | int) > (me.readingGoal | int) else 'r' }});" value="{{ booksThisYear }}" max="{{ me.readingGoal }}"></progress>
</section>

<!-- === Line Chart: Books per Year === -->
<section class="chart-section flow">
  <h3>Books Read Per Year</h3>
  <svg class="linechart" viewBox="0 0 200 100">

    {# --- Polyline connecting points --- #}
    <polyline
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      points="{% for p in points %}{{ p.x }},{{ p.y }} {% endfor %}"
    />

  {# --- Add circles at each data point --- #}
  {% for p in points %}
    <circle cx="{{ p.x }}" cy="{{ p.y }}" r="1.5">
        <title>{{ p.year }}: {{ p.count }} books read</title>
    </circle>
  {% endfor %}

  <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" stroke-width="0.5" />
  <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" stroke-width="0.5" />
  </svg>
</section>

<!-- === Horizontal Bar Chart: Genres for Latest Year === -->
<section class="chart-section flow">
  <h3 class="chart-title">Top 10 Genres</h3>
  {% set maxValue = books.rankedGenres[0].count %}
  <div class="chart-horizontal">
    {% for genre in books.rankedGenres %}
        {% if loop.index0 < 10 %}
        <div class="bar">
            <span class="meter" style="--value: {{ genre.count / maxValue * 100 }}%"></span>
            <span class="label">{{ genre.genre }}</span>
            <span class="count">{{ genre.count }}</span>
        </div>
        {% endif %}
    {% endfor %}
  </div>
</section>
