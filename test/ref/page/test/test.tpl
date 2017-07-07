<div class="test">
  {% pagelet $id="test" %}
    {% require $id="page/test/w-m" blab="123123" %}
  {% endpagelet %}

  {% require $id="page/test/w-s" %}
  {% require $id="widget/common" abc="123123" %}
</div>

{% script %}
require('./share.js').init();
{% endscript %}