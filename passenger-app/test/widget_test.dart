import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:passenger_app/main.dart';

void main() {
  testWidgets('App launches to the root shell with bottom navigation', (WidgetTester tester) async {
    await tester.pumpWidget(const PassengerApp());
    await tester.pump();

    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
