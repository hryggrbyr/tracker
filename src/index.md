---
title: Dashboard
layout: base.njk
---
# {{ title }}

## Currently Reading

## Books

<ul>
{% for book in frontmatter %}
<li><a href="{{ book.url }}">{{ book.frontmatter.title }}</a></li>
{% endfor %}
</ul>