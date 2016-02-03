if (Meteor.isClient) {
 
  // This code only runs on the client
  angular.module('issue-list',['angular-meteor']);
	
	angular.isUndefinedOrNull = function(val) {
			return angular.isUndefined(val) || val === null 
	}
 
  angular.module('issue-list').controller('IssueListCtrl', ['$scope', '$meteor', '$filter', '$timeout', '$window',
    function ($scope, $meteor, $filter, $timeout, $window) {
			$scope.issues = $meteor.collection(Issues);
			
			angular.element(document).ready(function () {
				$('.input-group.date').datepicker({
					format: "yyyy-mm-dd",
					weekStart: 1,
					todayBtn: "linked",
					todayHighlight: true
				});
			});
			
			$scope.issueList = function() {
				var _issues = $scope.issues;
				console.log("Los")
				console.log("original",_issues.length);
				_issues = $filter("filter")(_issues, $scope.filter)
				console.log("filter",_issues.length);
				_issues = $filter("orderBy")(_issues,$scope.orderBy, $scope.orderReverse);
				console.log("orderby",_issues.length);
				_issues = $filter("emptyToEnd")(_issues, $scope.orderBy);
				console.log("emptytoend",_issues.length);
				
				//var _issues = $filter("emptyToEnd")($filter("orderBy")($filter("filter")($scope.issues, $scope.filter),$scope.orderBy, $scope.orderReverse), $scope.orderBy);
				$scope.startFrom = $scope.startFrom<0?0:$scope.startFrom;
				if ($scope.startFrom + 10 > _issues.length){
					$scope.startFrom = _issues.length - 10 <0?0:_issues.length - 10;
					$scope.endAt = _issues.length;
				} else {
					$scope.endAt = $scope.startFrom+10;
				}
				$scope.filteredIssuesLength = _issues.length;

				return _issues.slice($scope.startFrom, $scope.endAt);
				
				//issue in (issues |filter:filter|orderBy:orderBy:orderReverse|emptyToEnd:orderBy|limitTo:issueLimit:0)
			}
			
			$scope.goTo = function (steps) {
				$scope.startFrom += steps;
			}
			
			$scope.issueModel = [
				{
					v: "counter",
					label: "#"
				}, {
					v: "createdOn",
					label: "Created on",
					type: "date"
				}, {
					v: "createdBy",
					label: "Created by",
					group: true
				}, {
					v: "status",
					label: "Status",
					type: "dropdown",
					lov: ["Open", "In work", "Review", "Re-Work", "Re-Review", "Closed", "Cancelled"]
				}, {
					v: "criticality",
					label: "Criticality",
					type: "dropdown",
					lov: ["Low", "Medium", "High"]
				}, {
					v: "ticketNr",
					label: "Ticket #",
					group: true
				}, {
					v: "resolvedOn",
					label: "Resolved on",
					type: "date",
					group: true
				}, {
					v: "resolvedBy",
					label: "Resolved by",
					group: true
				}, {
					v: "bugOrigin",
					label: "Bug Origin",
					type: "dropdown",
					lov: ["Undetermined", "CRM-T", "Oracle"]
				}, {
					v: "bugType",
					label: "Bug Type",
					type: "dropdown",
					lov: ["Config", "Infra", "EAI/ESB", "UI"]
				}, {
					v: "area",
					label: "Area",
					group: true,
					type: "dropdown",
					lov: ["Other", "KKM", "KM", "OM", "EAI", "Cross"]
				}, {
					v: "issue",
					label: "Issue"
				}, {
					v: "description",
					label: "Description",
					group: true,
					type: "multi"
				}, {
					v: "resolution",
					label: "Resolution",
					type: "multi"
				}, {
					v: "documentation",
					label: "Documentation",
					group: true,
					type: "multi"
				}, {
					v: "relatedDefects",
					label: "Related Defects",
					group: true
				}, {
					v: "oracleFeedbackRequired",
					label: "Oracle",
					type: "combinedBoolean",
					target: "oracleFeedback"
				}, {
					v: "oracleFeedback",
					label: "Oracle Feedback",
					group: true,
					type: "multi"
				}, {
					v: "images",
					label: "Images",
					group: true,
					type: "gallery"
				}
			];
			
			$scope.detail = {
				columns: 4,
				width:[10,10,45,35]
			};
			
			$scope.emptyCounter = 0;
			
			$scope.showAll = false;
			
			$scope.detail.perColumn = Math.ceil(($scope.issueModel.length - 1) / $scope.detail.columns);
			
			$scope.detail.groups = [];
			
			for (var i = 0; i < $scope.detail.columns; i++){
				var group = [];
				for (var n = 0; n < $scope.detail.perColumn; n++) {
					var c = i * $scope.detail.perColumn + n + 1;
					var model = $scope.issueModel[c];
					if (typeof model !== 'undefined')
						group.push(c);
				}
				$scope.detail.groups.push(group);
			}
			
      $scope.addIssue = function (issue) {
				var last = 0;
				$scope.issues.forEach(function(issue){
					last = issue.counter>last?issue.counter:last;
				});
				last++;
				if (!issue.counter){
					issue.counter = last;
				} else {
					issue = angular.copy(issue);
					delete issue._id;
					issue.counter = last;
					console.log(issue);
					$scope.newIssue = issue;
				}
        //$scope.issues.push(issue);
				Meteor.call("addNewIssue", $scope.newIssue);
				$scope.emptyIssue();
      }
			
			$scope.order = function(newOrder) {
				if($scope.orderBy==newOrder)
					$scope.orderReverse=!$scope.orderReverse;
				$scope.orderBy = newOrder;
			}
			
			$scope.filter = {};
			
			$scope.selectIssue = function(index, issue) {
				$scope.selectedIssue = index;
				$scope.newIssue = issue;
			}
			
			$scope.emptyIssue = function (){
				$scope.newIssue = {};
				
				
				$scope.selectedIssue = -1;
				$scope.issueModel.forEach(function(model, n){
					//$scope.newIssue[model.v] = "";
					if (model.type == 'dropdown')
						$scope.newIssue[model.v] = model.lov[0];
				});
				$scope.emptyCounter++;
				if (!$scope.emptyTimeout)
					$scope.emptyTimeout = $timeout(function(){if($scope.emptyCounter<5){$scope.emptyCounter = 0}else{$scope.enableRemove = !$scope.enableRemove;$scope.emptyCounter = 0}delete $scope.emptyTimeout;},1000);
			}
			
			$scope.removeIssue = function(_issue){
				$scope.issues.forEach(function(issue, n){
					if (issue.counter == _issue.counter) {
						$scope.issues.splice(n, 1);
						$scope.emptyIssue();
					}
				});
			}
			
			$scope.openImage = function (image){
				$window.open(image, "_blank")
			}
			
			$scope.removeImage = function (index){
				if (confirm("Do you really want to remove this image?"))
					$scope.newIssue.images.splice(index, 1);
			}
			
			$(document).on('paste', function(event){
				var items = (event.clipboardData || event.originalEvent.clipboardData).items;
				for (index in items) {
					var item = items[index];
					if (item.kind === 'file') {
						var blob = item.getAsFile();
						var reader = new FileReader();
						reader.onload = function(event){
							if (!$scope.newIssue.counter){
								if (!$scope.newIssue.images)
									$scope.newIssue.images=[];
								if ($scope.newIssue.images.indexOf(event.target.result)==-1){
									$scope.newIssue.images.push(event.target.result);
									$scope.$apply();
								} else {
									alert("This image has already been added.");
								}
							} else {
								Meteor.call("addNewImage", event.target.result, $scope.newIssue._id);
							}
						};
						reader.readAsDataURL(blob);
					}
				}
			});
			
    }
	]).filter("emptyToEnd", function () {
    return function (array, key) {
        if(!angular.isArray(array)) return;
        var present = array.filter(function (item) {
            return item[key];
        });
        var empty = array.filter(function (item) {
            return !item[key]
        });
        return present.concat(empty);
    };
	}).filter('unique', function() {
    return function(input, key) {
        if (!angular.isUndefinedOrNull(input)){
				var unique = {};
        var uniqueList = [];
        for(var i = 0; i < input.length; i++){
            if(typeof unique[input[i][key]] == "undefined"){
                unique[input[i][key]] = "";
                uniqueList.push(input[i]);
            }
        }
        return uniqueList;} else {
					return null;
				}
    };
	}).directive('render', function() {
		return {
			template: '<div> {{model}} </div>',
			link : function (scope, elem, attr) {
					scope.model = attr.model;
			}
		}
	});
}