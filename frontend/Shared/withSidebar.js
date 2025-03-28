import React from 'react';
import SidebarContainer from './SidebarContainer';

/**
 * Higher Order Component that adds sidebar navigation to any screen
 * @param {React.Component} Component - The component to wrap
 * @returns {React.Component} - The wrapped component with sidebar
 */
const withSidebar = (Component) => {
  return (props) => (
    <SidebarContainer>
      <Component {...props} />
    </SidebarContainer>
  );
};

export default withSidebar;