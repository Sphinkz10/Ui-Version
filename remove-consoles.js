module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  return j(fileInfo.source)
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: {
          name: name => ['log', 'info', 'debug', 'warn'].includes(name)
        }
      }
    })
    .forEach(path => {
      if (path.parent.node.type === 'ExpressionStatement') {
        j(path.parent).remove();
      } else {
        j(path).remove();
      }
    })
    .toSource();
};
