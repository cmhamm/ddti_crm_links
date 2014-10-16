(function() {
    var windowType;
    var user_id;
    var agent;
    var changed;
    
    return {
        requests: {
            fetchUser: function(userId) {
                return {
                    url: helpers.fmt('/api/v2/users/' + userId + '.json?include=organizations'),
                    type: 'GET',
                    dataType: 'json'
                };
            }
        },

        events: {
            'app.activated'     :   'onAppActivated',
            '*.changed'         :   'onChanged',
            'fetchUser.always'    :   'onBuildUri'
        },

        onAppActivated: function(data) {
            this.switchTo('loading');
            windowType = this.containerContext().location;
            if (windowType == 'user_sidebar') {
                if (this.user().externalId()) {
                    user_id = this.user().id();
                    this.ajax('fetchUser', user_id);
                } else {
                this.switchTo('missing');
                }
            } else {
                if((typeof this.ticket().requester() == 'undefined')) {
                    this.switchTo('blank');
                    return;
                } else {
                    if(data.requester_id) {
                        this.ajax('fetchUser',data.requester_id);
                        return;
                    }
                    if(this.ticket().requester().externalId()) {
                        user_id = this.ticket().requester().id();
                        this.ajax('fetchUser', user_id);
                    } else {
                        this.switchTo('missing');
                    }
                }
            }
        },

         onChanged: function(changed) {
            var fieldsToWatch = [];
            fieldsToWatch = ['ticket.requester.id'];
            if (_.contains(fieldsToWatch, changed.propertyName)) {
                changed.firstload = true;
                changed.requester_id = changed.newValue;
                this.onAppActivated(changed);
            }
        }, 
        
        onBuildUri: function(data) {
            var context = this.getContext(data);
            var buttons = this.makeButtons(context);
            this.switchTo('blank');
            this.switchTo('list', { buttons: buttons });
        },
        
        makeButtons: function(context) {
            var buttons = [];
            buttons.push({"label":this.settings.home_label,"url":this.settings.home_url});
            if (context.user.role == 'end-user') {
                    buttons.push({"label": this.settings.user_label, "url": _.template(this.settings.user_url, context, { interpolate : /\{\{(.+?)\}\}/g })});
                }
            if ((context.user.role == 'admin') | (context.user.role == 'agent')) {
                    buttons.push({"label": this.settings.agent_label, "url": _.template(this.settings.agent_url, context, { interpolate : /\{\{(.+?)\}\}/g })});
            }
            if (context.organization.external_id) {
                    buttons.push({"label": this.settings.org_label, "url": _.template(this.settings.org_url, context, { interpolate : /\{\{(.+?)\}\}/g })});
            }
            return buttons;
        },
        
        getContext: function(data) {
            var context = _.clone(this.containerContext());
            context.user = data.user;
            if (context.user.organization_id) {
                context.organization = _.find(data.organizations, function(org) {
                    return org.id == context.user.organization_id;
                });
            }
            if ((context.user.role == 'agent') | (context.user.role == 'admin')) {
                context.agent = {};
                context.agent.external_id = context.user.external_id;
            }
            return context;
        }
    };
}());