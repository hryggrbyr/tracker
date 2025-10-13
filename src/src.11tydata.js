const slugify = require("slugify");

module.exports = {
  eleventyComputed: {
    permalink: (data) => {
      const pathParts = data.page.filePathStem
        .split("/")
        .filter(part => part && part !== 'index');
      
      const slugifiedParts = pathParts.map((part) =>
        slugify(part, { lower: true, strict: true })
      );
      
      return slugifiedParts.length > 0
        ? `/${slugifiedParts.join("/")}/index.html`
        : `/index.html`;
    },
  },
};
