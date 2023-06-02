//const { highlightAll } = require("prismjs");

$(function () {
  if (!converter) {
    var converter = new showdown.Converter({ 'tables': true, noHeaderId: true, });
    converter.setFlavor('github');
  }
  if (post.contentType === 3) {
    $('#text').html(converter.makeHtml(post.content));
  } else {
    $('#text').html(post.content);
    $(".markdown").each(function (index, item) {
      $(this).html(converter.makeHtml($(this).text()));
    });
  }
  Prism.highlightAll();
  mermaid.initialize({ startOnLoad: true });
  displayToc();
  $('img[src^="/uploads/"]').attr('src', (index, oldValue) => { return 'https://subedis.com/' + oldValue; });

  function ajax(n, t, i, r) { i || (i = "GET"); r || (r = ""); $.ajax({ method: i, headers: { Authorization: "Bearer " + r }, url: n, data: {} }).done(function (n) { t(n) }).fail(function (n, t, i) { console.log("failed"); console.log(t, i, n) }) }

  function loadPosts(n) {
    const ids = [];
    $("post").each(function (i, e) { if (!documents[e.id]) { ids.push(e.id); } });
    if (ids.length > 0) {
      const token = localStorage.getItem('token');
      let bt = '';
      if (token) {
        bt = JSON.parse(token).token;
      } 
      const callback = function (result) {
        for (const p of result.posts) {
          const post = $(`post#${p.id}`);
          if (documents[p.id]) {
            post.html(documents[p.id]);
            return;
          }
          if (post.attr('display') === 'link') {
            createLink(p, post, 'post');
          } else {
            includePost(post, p.id);
          }
        }
        Prism.highlightAll();
      };
      ajax(`${apiUrl}posts?filterBy=ids=${ids.join(",")}`, callback, "GET", bt);
    }
  }
  function includePost(element, id) {
    if (documents[id]) {
      $(element).html(documents[id]);
      return;
    }
    var t = `${apiUrl}posts/${id}`,
      i = id,
      r = function (t) {
        var r = $("<div>")
          .append(
            $("<a>")
              .attr("href", `/posts/${t.id}/create`)
              .append(t.name)
          )
          .append("<br>"),
          u;
        r.append(t.contentType === 3 ? converter.makeHtml(t.content) : t.content);
        r.appendTo(element);
        documents[i] = t;
        Prism.highlightAll()
      };
    var bt = JSON.parse(localStorage.getItem('token')).token;
    ajax(t, r, 'GET', bt);
  }
  function createLink(entity, element, entityType) {
    let html = $("<a>")
      .attr("href", `/${entityType}s/${entity.id}`)
      .append(entity.name);
    html.appendTo(element);
    documents[entity.id] = html;
  }
  function loadLists(n) {
    var ids = [];
    $("list").each(function (i, e) { if (!documents[e.id]) { ids.push(e.id); } });
    if (ids.length > 0) {
      var bt = JSON.parse(localStorage.getItem('token')).token;
      var callback = function (result) {
        for (var list of result) {
          var element = $(`list#${list.id}`);
          if (documents[list.id]) {
            element.html(documents[list.id]);
            return;
          }
          switch (element.attr('display')) {
            case 'link':
              createLink(list, element, 'list');
              break;

            case 'vertical':
              createVerticalList(list, element);
              break;

            default:
              createHorizontalList(list, element);
              break;
          }
        }
      };
      ajax(`${apiUrl}lists?ids=${ids.join("&ids=")}&includeListItems=true`, callback, "GET", bt);
    }
    /*$("list").each(function (index, element) {
      if (documents[this.id]) {
        $(element).html(documents[this.id]);
        return;
      }
      var t = `${apiUrl}lists/${this.id}?includeListItems=true`;
      var r = function (list) {
        switch (element.getAttribute('display')) {
          case 'link':
            createLink(list, element, 'list');
            break;

          case 'vertical':
            createVerticalList(list, element);
            break;

          default:
            createHorizontalList(list, element);
            break;
        }
      };
      var bt = JSON.parse(localStorage.getItem('token')).token;
      ajax(t, r, 'GET', bt);
    });*/
  }
  function createHorizontalList(list, element) {
    var row = $("<tr>");
    row.append(
      $("<th>").append(
        $("<a>")
          .attr("href", "/lists/" + list.id)
          .append(list.name)
      )
    );
    $.each(list.listItems, function (n, t) {
      row.append(
        $("<td>")
          .attr("id", t.id)
          .attr("class", t.isChecked ? "striked" : "")
          .append(t.name)
      );
    });
    var table = $("<table>").append(row);
    table.appendTo(element);
    documents[list.id] = table;
  }
  function createVerticalList(list, element) {
    var table = $("<table>");
    var link = $("<tr>").append(
      $("<th>").append(
        $("<a>")
          .attr("href", `/lists/${list.id}`)
          .append(list.name)
      )
    );
    table.append(link);
    $.each(list.listItems, function (_, listItem) {
      var row = $("<tr>");
      var col = $("<td>")
        .attr("id", listItem.id)
        .attr("class", listItem.isChecked ? "striked" : "")
        .append(listItem.name);
      row.append(col);
      row.appendTo(table);
    });
    table.appendTo(element);
    documents[list.id] = table;
  }
  $(function () {
    loadPosts();
    loadLists();
  });
  var documents = {};
});