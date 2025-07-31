---
tags: [ fantasy ]
title: "Catching Fire"
subtitle: "The Hunger Games 2"
author: [Suzanne Collins]
publisher: Scholastic Press
published: 2009-01-01T07:00:00+01:00
page_count: 
isbn:  
description: ""
coverUrl: https://covers.openlibrary.org/b/olid/OL22842132M-M.jpg
shelf: read
owned: TRUE
start_date: 
finished_date: 2014-02-02
rating: 3
recommended_by: 
created: 2015-10-06
---

# Catching Fire by Suzanne Collins

```dv
if (dv.current().coverUrl) {
    dv.el("img", "", {
        attr: {
            src: dv.current().coverUrl,
            alt: "Book Cover Art",
            style: "width: 100px; height: auto;"
        }
    });
} else {
    dv.el("p", "No cover image");
}
```

| Shelf | `= this.shelf` |
| --- | --- |
| Genre | `= this.tags` |
| Started | `= this.start_date` |
| Finished | `= this.end_date` |
| Rating | `= this.rating`/5 |

