module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let dirty = false;

  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { name: 'console' },
      property: { type: 'Identifier' }
    }
  }).forEach(path => {
    const methodName = path.node.callee.property.name;
    if (['log', 'info', 'debug'].includes(methodName)) {
      dirty = true;
      const parent = path.parent;
      if (parent.node.type === 'ExpressionStatement') {
        j(parent).remove();
      } else {
        j(path).replaceWith(j.identifier('undefined'));
      }
    }
  });

  return dirty ? root.toSource() : null;
};
